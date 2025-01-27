<?php
$config = include('../config/db_config.php');
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
ob_start();


// Connexion à la base de données
$conn = new mysqli($config['servername'], $config['username'], $config['password'], $config['dbname']);

if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "Database connection error."
    ]);
    exit;
}

// Récupération de l'ID de l'objet et du personnage
$item_id = isset($_GET['item_id']) ? intval($_GET['item_id']) : 0;
$character_id = 1; // ID temporaire du personnage pour les tests

if ($item_id <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid item ID."]);
    exit;
}

// Récupération des informations de l'objet depuis `items`
$sql_item = "SELECT items.effect_type, items.effect_value, items.is_unique, inventory.quantity
             FROM inventory
             JOIN items ON inventory.item_id = items.id
             WHERE inventory.character_id = ? AND inventory.item_id = ?";
$stmt_item = $conn->prepare($sql_item);
$stmt_item->bind_param("ii", $character_id, $item_id);

if (!$stmt_item->execute()) {
    echo json_encode(["success" => false, "message" => "Error retrieving item information."]);
    exit;
}

$result_item = $stmt_item->get_result();

if ($result_item->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Item not found in inventory."]);
    exit;
}

$item = $result_item->fetch_assoc();
error_log("Item fetched: " . json_encode($item));

// Vérification de la quantité
if ($item['quantity'] <= 0) {
    echo json_encode(["success" => false, "message" => "You no longer have this item."]);
    exit;
}

// Application de l'effet de l'objet
$response_message = "";
$should_reduce_quantity = true; // Flag pour déterminer si la quantité doit être réduite

switch ($item['effect_type']) {
    case 'heal':
        $heal_value = $item['effect_value'];
    
        // Vérification de la santé actuelle
        $sql_check_health = "SELECT health FROM characters WHERE id = ?";
        $stmt_check = $conn->prepare($sql_check_health);
        $stmt_check->bind_param("i", $character_id);
        $stmt_check->execute();
        $result_check = $stmt_check->get_result();
        $current_health = $result_check->fetch_assoc()['health'];
        
        if (!$current_health) {
            error_log("Erreur : Impossible de récupérer la santé actuelle du personnage.");
            echo json_encode(["success" => false, "message" => "Erreur lors de la récupération des statistiques du personnage."]);
            exit;
        }
        
        // Ajout de logs pour vérifier la santé actuelle
        error_log("Current Health before healing: " . $current_health);
    
        if ($current_health >= 100) {
            $response_message = "Health already at maximum!";
            $should_reduce_quantity = false;
            
            // Retourner immédiatement la réponse avec message et bordure rouge
            echo json_encode([
                "success" => false,
                "message" => $response_message
            ]);
            exit;
        } else {
            $sql_update_health = "UPDATE characters SET health = LEAST(100, health + ?) WHERE id = ?";
            $stmt_health = $conn->prepare($sql_update_health);
            $stmt_health->bind_param("ii", $heal_value, $character_id);
    
            if (!$stmt_health->execute()) {
                error_log("Error applying healing effect: " . $conn->error);
                echo json_encode(["success" => false, "message" => "Error applying healing effect."]);
                exit;
            }

            // Log pour confirmer que la base est mise à jour avec les nouvelles stats
            error_log("Health updated in database: New Health = " . min(100, $current_health + $heal_value));
    
            // Ajout du log pour confirmer la mise à jour
            error_log("Healing effect applied. New health: " . min(100, $current_health + $heal_value));
    
            $response_message = "Restored $heal_value HP.";

            // Récupérer les stats mises à jour
            $sql_fetch_updated_stats = "SELECT health, max_health, strength, endurance FROM characters WHERE id = ?";


            $stmt_fetch_updated_stats = $conn->prepare($sql_fetch_updated_stats);
            $stmt_fetch_updated_stats->bind_param("i", $character_id);
            $stmt_fetch_updated_stats->execute();
            $result_updated_stats = $stmt_fetch_updated_stats->get_result();
            $updated_stats = $result_updated_stats->fetch_assoc();
            error_log("Updated character stats: " . json_encode($updated_stats));


            // Récupération des HP de l'ennemi
            $sql_enemy_hp = "SELECT hp, max_health FROM enemies WHERE id = ?";
            $stmt_enemy_hp = $conn->prepare($sql_enemy_hp);
            $enemy_id = 1;  // ID temporaire de l'ennemi à adapter dynamiquement plus tard
            $stmt_enemy_hp->bind_param("i", $enemy_id);
            $stmt_enemy_hp->execute();
            $result_enemy_hp = $stmt_enemy_hp->get_result();
            $enemy_stats = $result_enemy_hp->fetch_assoc();
            
            // Vérification et assignation sécurisée des HP de l'ennemi depuis la base de données
            if ($enemy_stats) {
                $updated_stats['enemy_hp'] = $enemy_stats['hp'];
                $updated_stats['enemy_max_hp'] = $enemy_stats['max_health'];
            } else {
                error_log("Erreur : Impossible de récupérer les statistiques de l'ennemi.");
                echo json_encode(["success" => false, "message" => "Erreur lors de la récupération des statistiques de l'ennemi."]);
                exit;
            }
            
            error_log("Enemy HP fetched dynamically: " . $updated_stats['enemy_hp'] . " / " . $updated_stats['enemy_max_hp']);
            

            // Vérification des données ennemies
            if (!isset($enemy_stats['hp']) || !isset($enemy_stats['max_health'])) {
                error_log("Erreur : Impossible de récupérer les statistiques de l'ennemi.");
                echo json_encode(["success" => false, "message" => "Erreur lors de la récupération des statistiques de l'ennemi."]);
                exit;
            } else {
                $updated_stats['enemy_hp'] = $enemy_stats['hp'];
                $updated_stats['enemy_max_hp'] = $enemy_stats['max_health'];
}

// Logs pour vérifier les valeurs obtenues
error_log("Enemy HP fetched: " . $updated_stats['enemy_hp'] . " / " . $updated_stats['enemy_max_hp']);
error_log("Enemy stats added to response: " . json_encode($enemy_stats));
            echo json_encode([
                "success" => true,
                "message" => $response_message,
                "stats" => $updated_stats // Retourne les nouvelles stats
            ]);
            exit;
        }
        break;


        case 'boost':
            $boost_value = $item['effect_value'];
    
            // Récupération de la force actuelle
            $sql_check_strength = "SELECT strength FROM characters WHERE id = ?";
            $stmt_check_strength = $conn->prepare($sql_check_strength);
            $stmt_check_strength->bind_param("i", $character_id);
            $stmt_check_strength->execute();
            $result_check_strength = $stmt_check_strength->get_result();
            $current_strength = $result_check_strength->fetch_assoc()['strength'];
            error_log("Current Strength before boost: " . $current_strength);
    
            $sql_update_strength = "UPDATE characters SET strength = LEAST(50, strength + ?) WHERE id = ?";
            $stmt_strength = $conn->prepare($sql_update_strength);
            $stmt_strength->bind_param("ii", $boost_value, $character_id);
    
            if (!$stmt_strength->execute()) {
                error_log("Error applying strength boost: " . $conn->error);
                echo json_encode(["success" => false, "message" => "Error applying strength boost."]);
                exit;
            }
    
            // Log pour confirmer que la force est mise à jour dans la base
            error_log("Strength updated in database: New Strength = " . min(50, $current_strength + $boost_value));
    
            $response_message = "Strength increased by $boost_value.";
            break;
    
        default:
            echo json_encode(["success" => false, "message" => "Unknown effect type."]);
            exit;
    }
    
        // Réduction de la quantité de l'objet uniquement si nécessaire
        if ($should_reduce_quantity) {
            $new_quantity = max(0, $item['quantity'] - 1);
            $sql_reduce_quantity = "UPDATE inventory SET quantity = ? WHERE character_id = ? AND item_id = ?";
            $stmt_reduce = $conn->prepare($sql_reduce_quantity);
            $stmt_reduce->bind_param("iii", $new_quantity, $character_id, $item_id);

            if (!$stmt_reduce->execute()) {
                error_log("Error updating item quantity: " . $conn->error);
                echo json_encode(["success" => false, "message" => "Error updating item quantity."]);
                exit;
            }

            // Vérification après mise à jour de la quantité
            error_log("Inventaire mis à jour pour l'item ID $item_id. Nouvelle quantité: $new_quantity");

            // Assurer que la nouvelle quantité est bien mise à jour dans $updated_stats
            $updated_stats['item_id'] = $item_id;
            $updated_stats['item_quantity'] = $new_quantity;
        }

    
        // Vérification des valeurs de l'ennemi avant envoi
        if ($updated_stats['enemy_hp'] > $updated_stats['enemy_max_hp']) {
            $updated_stats['enemy_hp'] = $updated_stats['enemy_max_hp'];
            error_log("Correction : Les HP de l'ennemi dépassaient le maximum, ajustement à " . $updated_stats['enemy_max_hp']);
        }

        error_log("Final stats before response: " . json_encode($updated_stats));


    // Génération de la réponse JSON finale
    $response = json_encode([
        "success" => true,
        "message" => $response_message,
        "stats" => [
            "health" => isset($updated_stats['health']) ? $updated_stats['health'] : 100,
            "max_health" => isset($updated_stats['max_health']) ? $updated_stats['max_health'] : 100,
            "strength" => isset($updated_stats['strength']) ? $updated_stats['strength'] : 0,
            "endurance" => isset($updated_stats['endurance']) ? $updated_stats['endurance'] : 0,
            "enemy_hp" => isset($updated_stats['enemy_hp']) ? $updated_stats['enemy_hp'] : 150,
            "enemy_max_hp" => isset($updated_stats['enemy_max_hp']) ? $updated_stats['enemy_max_hp'] : 150
        ]
    ]);
    
    
    
    // Vérification des erreurs JSON avant l'envoi
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Erreur d'encodage JSON : " . json_last_error_msg());
        ob_end_clean();
        echo json_encode(["success" => false, "message" => "Erreur lors de l'encodage des données."]);
    } else {
        ob_end_flush();
        error_log("Réponse envoyée au client: " . $response);
        echo $response;
    }
    
   
    $stmt_health->close();
    $stmt_check->close();
    $stmt_enemy_hp->close();
    $stmt_item->close();
    $stmt_fetch_updated_stats->close();
    $stmt_reduce->close();


    $conn->close();
    error_log("Final updated stats sent to frontend: " . json_encode($updated_stats));

    ob_end_flush();

    exit;
    