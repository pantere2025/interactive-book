<?php

// Inclure la configuration
$config = include('../config/db_config.php');

// Connexion à la base de données
$conn = new mysqli($config['servername'], $config['username'], $config['password'], $config['dbname']);

// Vérification de la connexion
if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "Database connection error."
    ]);
    exit;
}

// Récupération de l'inventaire du joueur classé par catégories
$character_id = 1; // ID temporaire du personnage
$sql_inventory = "
    SELECT 
        items.category, 
        items.name, 
        items.icon, 
        items.id AS item_id, 
        COALESCE(inventory.quantity, 0) AS quantity, 
        items.is_unique, 
        items.effect_type, 
        items.effect_value 
    FROM items
    LEFT JOIN inventory ON items.id = inventory.item_id AND inventory.character_id = ?
    WHERE NOT (items.is_unique = 1 AND COALESCE(inventory.quantity, 0) = 0)
    ORDER BY items.category, items.name";

$stmt_inventory = $conn->prepare($sql_inventory);
if (!$stmt_inventory) {
    error_log("Error preparing inventory query: " . $conn->error);
    echo json_encode(["success" => false, "message" => "Failed to prepare inventory query."]);
    exit;
}

$stmt_inventory->bind_param("i", $character_id);
$stmt_inventory->execute();
$result_inventory = $stmt_inventory->get_result();
if (!$result_inventory) {
    error_log("Error executing inventory query: " . $conn->error);
    $inventory_by_category = [];
} else {
    // Organisation des objets par catégories
    $inventory_by_category = [];
    while ($row = $result_inventory->fetch_assoc()) {
        $category = $row['category'];
        if (!isset($inventory_by_category[$category])) {
            $inventory_by_category[$category] = [];
        }
        $inventory_by_category[$category][] = $row;
    }
}
?>

<!-- Début du Modal -->
<div id="inventory-modal" class="modal">
    <div class="modal-content">
        <!-- Titre de l'inventaire avec le bouton de fermeture -->
        <div class="inventory-header">
            <h2>Your Inventory</h2>
            <span class="close-button" onclick="closeInventory()">&times;</span>
        </div>

        <!-- Affichage des catégories et objets -->
        <?php if (empty($inventory_by_category)): ?>
            <div class="inventory-empty">
                <p>Your inventory is currently empty. Explore the world to find items!</p>
            </div>
        <?php else: ?>
            <?php foreach ($inventory_by_category as $category => $items): ?>
                <?php if (!empty($items)): ?>
                    <div class="inventory-category">
                        <h3><?php echo ucfirst($category); ?></h3>
                        <div class="inventory-grid">
                            <?php foreach ($items as $item): ?>
                                <div class="inventory-item <?php echo ($item['quantity'] <= 0) ? 'disabled' : ''; ?>" 
                                     id="item-<?php echo $item['item_id']; ?>" 
                                     data-is-unique="<?php echo $item['is_unique']; ?>">
                                    <img src="../images/items/<?php echo $item['icon']; ?>" alt="<?php echo $item['name']; ?>">
                                    <p><strong><?php echo $item['name']; ?></strong></p>
                                    <p class="item-effect">
                                        <?php
                                        if (!empty($item['effect_type'])) {
                                            switch ($item['effect_type']) {
                                                case 'heal':
                                                    echo "Restores " . $item['effect_value'] . " HP.";
                                                    break;
                                                case 'boost':
                                                    echo "Increases strength by " . $item['effect_value'] . ".";
                                                    break;
                                                case 'unlock':
                                                    echo "Unlocks a special path or door.";
                                                    break;
                                                default:
                                                    echo "Unknown effect.";
                                            }
                                        } else {
                                            echo "No known effect.";
                                        }
                                        ?>
                                    </p>
                                    <p class="item-quantity"><?php echo $item['quantity']; ?>x</p>
                                    <button 
                                        onclick="useItem(<?php echo $item['item_id']; ?>, '<?php echo strtolower($category); ?>')" 
                                        <?php echo ($item['quantity'] <= 0) ? 'disabled' : ''; ?>>
                                        Use
                                    </button>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endif; ?>
            <?php endforeach; ?>
        <?php endif; ?>
        <div class="inventory-feedback" style="display:none;"></div>
    </div>
</div>

</div>
</div>

<script>
// Fonction pour masquer le modal avec une animation
function closeInventory() {
    const modal = document.getElementById("inventory-modal");
    modal.classList.add("fade-out");
    setTimeout(() => {
        modal.style.display = "none";
        modal.classList.remove("fade-out");
        document.body.style.overflow = "auto"; // Réactiver le défilement de la page
    }, 500);
}

// Fonction pour ouvrir le modal
function openInventory() {
    const modal = document.getElementById("inventory-modal");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden"; // Désactiver le défilement de la page
}

// Fonction pour afficher un message temporaire sous la catégorie correspondante
function displayEffectMessage(category, message) {
    const effectMessageDiv = document.getElementById(`effect-message-${category}`);
    if (effectMessageDiv) {
        effectMessageDiv.textContent = message; // Ajoute le texte du message
        effectMessageDiv.style.display = "block"; // Rends le bloc visible

        // Cache le message après 3 secondes
        setTimeout(() => {
            effectMessageDiv.style.display = "none"; // Cache le bloc après 3 secondes
        }, 3000);
    }
}

// Fonction pour utiliser un objet
function useItem(itemId, category) {
    fetch(`use_item.php?item_id=${itemId}`)
        .then(response => response.json())
        .then(data => {
            console.log("Response from use_item.php:", data); // Debug pour afficher les données
            if (data.success) {
                displayEffectMessage(category, data.message);

                // Gestion de l'élément dans le DOM
                const itemElement = document.getElementById(`item-${itemId}`);
                if (!itemElement) {
                    console.error(`Item element not found for ID: ${itemId}`);
                    return;
                }

                const quantityElement = itemElement.querySelector('.item-quantity');
                if (!quantityElement) {
                    console.error(`Quantity element not found for item ID: ${itemId}`);
                    return;
                }

                const isUnique = itemElement.dataset.isUnique === "1"; // Vérifie si l'objet est unique
                if (isUnique) {
                    console.log(`Unique item ID ${itemId} removed.`);
                    itemElement.remove();
                } else {
                    const currentQuantity = parseInt(quantityElement.textContent);
                    if (currentQuantity > 1) {
                        quantityElement.textContent = `${currentQuantity - 1}x`;
                        console.log(`Quantity updated for item ID ${itemId}: ${currentQuantity - 1}`);
                    } else {
                        console.log(`Item ID ${itemId} is now out of stock.`);
                        itemElement.classList.add('disabled');
                        const button = itemElement.querySelector('button');
                        button.disabled = true;
                    }
                }
            } else {
                console.error("Failed to use item:", data.message);
                displayEffectMessage(category, data.message || "Failed to use item.");
            }
        })
        .catch(error => {
            console.error('Error using item:', error);
            displayEffectMessage(category, "An error occurred. Please try again.");
        });
}

</script>
