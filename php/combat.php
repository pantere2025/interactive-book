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

// Récupération des données du personnage
$character_id = 1;
$sql_character = "SELECT * FROM characters WHERE id = ?";
$stmt_character = $conn->prepare($sql_character);
$stmt_character->bind_param("i", $character_id);
$stmt_character->execute();
$result_character = $stmt_character->get_result();

if ($result_character->num_rows > 0) {
    $character = $result_character->fetch_assoc();
    $rules_seen = isset($character['rules_seen']) ? $character['rules_seen'] : 0;
} else {
    die("No character found! Please ensure ID $character_id exists in the characters table.");
}



// Récupération dynamique de l'ennemi à partir de l'ID passé en paramètre
$enemy_id = isset($_GET['enemy_id']) ? intval($_GET['enemy_id']) : 1; // Par défaut, ID 1
$sql_enemy = "SELECT * FROM enemies WHERE id = ?";
$stmt_enemy = $conn->prepare($sql_enemy);

if (!$stmt_enemy) {
    error_log("Erreur : Échec de la préparation de la requête pour récupérer l'ennemi. SQL Error : " . $conn->error);
    echo json_encode([
        "success" => false,
        "message" => "Erreur de préparation de la requête pour l'ennemi."
    ]);
    exit;
}

$stmt_enemy->bind_param("i", $enemy_id);

if (!$stmt_enemy->execute()) {
    error_log("Erreur : Échec de l'exécution de la requête pour récupérer l'ennemi. SQL Error : " . $conn->error);
    echo json_encode([
        "success" => false,
        "message" => "Erreur lors de l'exécution de la requête pour l'ennemi."
    ]);
    exit;
}

$result_enemy = $stmt_enemy->get_result();

if ($result_enemy->num_rows > 0) {
    $enemy = $result_enemy->fetch_assoc();
    error_log("Enemy data après récupération SQL : " . json_encode($enemy));
    error_log("Données de l'ennemi récupérées : " . json_encode($enemy));
} else {
    echo json_encode([
        "success" => false,
        "message" => "Ennemi introuvable dans la base de données."
    ]);
    error_log("Erreur : Aucun ennemi trouvé avec l'ID $enemy_id.");
    exit;
}

error_log("Debug PHP: Enemy max_health = " . json_encode($enemy['max_health']));

// Vérification des règles déjà vues
if ($rules_seen == 0) {

    $sql_update_rules = "UPDATE characters SET rules_seen = 1 WHERE id = ?";
    $stmt_update_rules = $conn->prepare($sql_update_rules);
    $stmt_update_rules->bind_param("i", $character_id);
    $stmt_update_rules->execute();
}

// Vérification et journalisation des stats avant écriture
error_log("Stats fetched from database for cache initialization: " . json_encode($character));


?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Combat Page</title>
    <style>
    .hidden {
        display: none;
    }
    </style>
    <link rel="stylesheet" href="../css/combat.css">
    <link rel="stylesheet" href="../css/inventory.css">
    <link rel="stylesheet" href="../css/fonts.css">
    <link rel="stylesheet" href="../css/rules.css">
    <link rel="stylesheet" href="../css/flee_modal.css">
    <link rel="stylesheet" href="../css/logs_modal.css"> <!-- Nouveau fichier CSS pour le modal des logs -->
    <link rel="stylesheet" href="../css/combat-anim.css">

    <script src="../js/inventory.js" defer></script>
    <script src="../js/rules.js" defer></script>


    <script>
    document.addEventListener('DOMContentLoaded', () => {
        
  // Charger les données dynamiques depuis PHP
fetch('get_character_stats.php')
    .then(response => response.json())
    .then(data => {
        // Sélection des éléments DOM
        const playerHpElement = document.querySelector('.stat-box .hp');
        const playerStrengthElement = document.querySelector('.stat-box .strength');
        const playerEnduranceElement = document.querySelector('.stat-box .endurance');
        const enemyHpElement = document.querySelector('.stat-box.enemy .enemy-hp');
        const enemyStrengthElement = document.querySelector('.stat-box.enemy .enemy-strength');
        const enemyDefenseElement = document.querySelector('.stat-box.enemy .enemy-defense');
        const enemyImageElement = document.querySelector('.enemy-image img');
        const combatHeaderElement = document.querySelector('.combat-header h1');

        // Vérification des éléments DOM
        if (!playerHpElement || !playerStrengthElement || !playerEnduranceElement || 
            !enemyHpElement || !enemyStrengthElement || !enemyDefenseElement || 
            !enemyImageElement || !combatHeaderElement) {
            console.error("Erreur : Certains éléments DOM nécessaires sont introuvables.");
            return;
        }

        // Initialiser les statistiques du joueur
        playerHpElement.textContent = `HP: ${data.stats.health}`;
        playerStrengthElement.textContent = `Strength: ${data.stats.strength}`;
        playerEnduranceElement.textContent = `Endurance: ${data.stats.endurance}`;

        // Initialiser les données de l'ennemi dynamiquement
        enemyImageElement.src = `../images/enemies/${data.enemy.image}`;
        enemyImageElement.alt = data.enemy.name;
        combatHeaderElement.textContent = `Battle against ${data.enemy.name}`;
        enemyHpElement.textContent = `HP: ${data.enemy.hp}`;
        enemyStrengthElement.textContent = `Strength: ${data.enemy.strength}`;
        enemyDefenseElement.textContent = `Defense: ${data.enemy.defense}`;
    })
    .catch(error => console.error("Erreur lors du chargement des données :", error));
      
    });
</script>

</head>
<body>
<div class="main-container">
    <div class="container">
    <?php if ($rules_seen == 0): ?>
            <?php include '../components/rules.php'; ?>
        <?php endif; ?>

        <div class="combat-header">
            <h1>Battle against <?php echo htmlspecialchars($enemy['name']); ?></h1>
            <p class="enemy-description"><?php echo htmlspecialchars($enemy['description']); ?></p>
        </div>

        <div class="enemy-image" data-damage-effect="<?php echo htmlspecialchars($enemy['damage_effect']); ?>">
            <img src="../images/enemies/<?php echo htmlspecialchars($enemy['image']); ?>" alt="<?php echo htmlspecialchars($enemy['name']); ?>">
            <div class="damage-overlay"></div>
        </div>

<div class="stats">
    <div class="stat-box">
        <div class="health-bar">
            <div id="player-health-bar" class="health-fill player" style="width: 100%;" data-max-hp="<?php echo htmlspecialchars($character['max_health']); ?>"></div>
        </div>
        <h2 class="stat-title">Your Stats</h2>
        <p class="hp">HP: <?php echo htmlspecialchars($character['health']); ?></p>
        <p class="strength">Strength: <?php echo htmlspecialchars($character['strength']); ?></p>
        <p class="defense">Defense: <?php echo htmlspecialchars($character['defense']); ?></p>
    </div>
    <div class="stat-box enemy">
    <div class="health-bar">
    <div id="enemy-health-bar" class="health-fill enemy" data-max-hp="<?php echo htmlspecialchars($enemy['hp']); ?>" style="width: 100%;"></div>
    </div>
        <h2 class="stat-title">Enemy Stats</h2>
        <p class="enemy-hp">HP: <?php echo htmlspecialchars($enemy['hp']); ?></p>
        <p class="enemy-strength">Strength: <?php echo htmlspecialchars($enemy['strength']); ?></p>
        <p class="enemy-defense">Defense: <?php echo htmlspecialchars($enemy['defense']); ?></p>
    </div>
</div>


        <div class="dice-results" style="display: none;">
            <div class="player-dice">
                <h3>Your Roll: <span id="player-result">0</span></h3>
                <div class="dice-container">
                    <img class="dice" src="../images/dice/dice-face-1.png" alt="Player Dice 1">
                    <img class="dice" src="../images/dice/dice-face-2.png" alt="Player Dice 2">
                </div>
            </div>
            <div class="combat-shield">
                <img class="shield" src="../images/combat-shield.png" alt="Shield">
            </div>
            <div class="enemy-dice">
                <h3>Enemy Roll: <span id="enemy-result">0</span></h3>
                <div class="dice-container">
                    <img class="dice" src="../images/dice/dice-face-red-1.png" alt="Enemy Dice 1">
                    <img class="dice" src="../images/dice/dice-face-red-2.png" alt="Enemy Dice 2">
                </div>
            </div>
        </div>

        <div id="combat-log" style="display: none;">
            <p id="combat-log-current"></p>
        </div>


        <div class="actions">
            <button id="attack-button" class="attack">Attack</button>
            <button class="dodge">Dodge</button>
            <button class="flee">Flee</button>
        </div>

        <div class="inventory-button">
            <button onclick="openInventory();">Show Inventory</button>
            <button id="show-logs-button">Afficher tous les logs</button>
        </div>

        <div class="inventory-feedback" style="display:none;"></div>
        <?php include 'inventory.php'; ?>

       <!--  <div id="flee-modal" class="modal">
            <div class="modal-content">
                <h2>Le combat s'éternise</h2>
                <p>Voulez-vous continuer à vous battre ou fuir ?</p>
                <div class="modal-buttons">
                    <button id="continue-fight">Continuer</button>
                    <button id="flee-fight">Fuir</button>
                </div>
            </div>
        </div> 
        -->

        <!-- Modal pour afficher tous les logs -->
        <div id="logs-modal" class="modal hidden">
          <div id="logs-modal-content">
        <h2>Historique des logs</h2>
        <div id="all-logs-container"></div>
        <button id="close-logs-modal">Fermer</button>
        </div>
        </div>

    </div>
</div>   
<script src="../js/combat-core.js"></script>
<script src="../js/combat-ui.js"></script>
<script src="../js/combat-animations.js"></script>
<script src="../js/combat.js"></script>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        const rulesModal = document.getElementById('rules-modal');
        if (rulesModal) {
            rulesModal.style.display = 'flex';
        }

        // Gestion du modal des logs
        const logsModal = document.getElementById('logs-modal');
        const showLogsButtonCombat = document.getElementById('show-logs-button'); // Bouton logs de la page combat
        const showLogsButtonVictory = document.getElementById('view-logs-btn');   // Bouton logs du modal victoire
        const closeLogsModal = document.getElementById('close-logs-modal');
        const combatEndModal = document.getElementById('combat-end-modal');

        let openedFromVictory = false;

        // Fonction pour charger les logs depuis le DOM sans appel serveur
        function displayCombatLogs() {
    const logsContainer = document.getElementById('all-logs-container');
    logsContainer.innerHTML = ''; // Nettoyer l'affichage précédent

    combatLogs.forEach(log => {
        const logEntry = document.createElement('p');
        logEntry.className = log.type === 'player' ? 'player-log' : 'enemy-log';
        logEntry.textContent = log.message;
        logsContainer.appendChild(logEntry);
    });

    logsModal.classList.add('show');
}


        // Bouton pour afficher les logs depuis la page de combat
        showLogsButtonCombat.addEventListener('click', () => {
            displayCombatLogs();
            logsModal.classList.add('show');
            openedFromVictory = false;  // On est dans le contexte de la page combat
        });

        // Bouton pour afficher les logs depuis le modal de victoire
        showLogsButtonVictory.addEventListener('click', () => {
            displayCombatLogs();
            logsModal.classList.add('show');
            combatEndModal.classList.add('hidden'); // Cache le modal victoire
            openedFromVictory = true;  // On est dans le contexte du modal victoire
        });

        // Fermeture du modal des logs
        closeLogsModal.addEventListener('click', () => {
            logsModal.classList.remove('show');

            // Si les logs ont été ouverts depuis la victoire, on retourne au modal victoire
            if (openedFromVictory) {
                combatEndModal.classList.remove('hidden');
            }
            openedFromVictory = false;
        });

    });
</script>


<!-- Modal de fin de combat -->
<div id="combat-end-modal" class="modal hidden">
    <div class="modal-content">
        <img src="../images/victory-image.jpg" alt="Victory" class="victory-image">
            <p class="victory-message">Vous avez vaincu l'ennemi et gagné 100 XP.</p>
        <div class="modal-buttons">
            <button id="view-logs-btn">Voir les logs</button>
            <button id="continue-btn">Continuer</button>
        </div>
    </div>
</div>

</body>
</html>
