// Initialisation du compteur de rounds
let roundCounter = 0;

// Fonction pour gérer l'attaque
async function attack() {
    // Incrémenter le compteur de rounds
    roundCounter++;

    // Afficher le Combat Log après le premier clic
    console.log("Début de la fonction attack, round actuel :", roundCounter);
    showCombatLog();

    // Rendre le bouton "Afficher tous les logs" visible après la première attaque
    const showLogsButton = document.getElementById('show-logs-button');
    if (showLogsButton.style.display === 'none') {
    showLogsButton.style.display = 'inline-block';
    console.log("Bouton 'Afficher tous les logs' rendu visible après la première attaque.");
    }

    // Désactiver le bouton "Attack" temporairement pour éviter des clics multiples
    const attackButton = document.querySelector('button.attack');
    attackButton.disabled = true;

    // Lancer l'animation des dés et gérer les résultats
    const { playerResult, enemyResult } = await showDiceAnimation();

    // Récupérer les stats dynamiques
    let playerHp = parseInt(document.querySelector('.hp').textContent.split(': ')[1]);
    let playerStrength = parseInt(document.querySelector('.strength').textContent.split(': ')[1]);
    let playerDefense = parseInt(document.querySelector('.defense').textContent.split(': ')[1]);

    let enemyHp = parseInt(document.querySelector('.enemy-hp').textContent.split(': ')[1]);
    let enemyStrength = parseInt(document.querySelector('.enemy-strength').textContent.split(': ')[1]);
    let enemyDefense = parseInt(document.querySelector('.enemy-defense').textContent.split(': ')[1]);

    // Calcul des dégâts
    let playerAttackScore = playerResult + playerStrength;
    let enemyDefenseScore = enemyResult + enemyDefense;
    let playerDamage = Math.max(1, playerAttackScore - enemyDefenseScore);
    enemyHp = Math.max(0, enemyHp - playerDamage);

    let enemyAttackScore = enemyResult + enemyStrength;
    let playerDefenseScore = playerResult + playerDefense;
    let enemyDamage = Math.max(1, enemyAttackScore - playerDefenseScore);
    playerHp = Math.max(0, playerHp - enemyDamage);

    // Mise à jour combinée des HP dans la base de données
    try {
        const response = await fetch('update_stats.php', {
            
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playerId: 1, // Remplacer par une variable dynamique si nécessaire
                playerHp: playerHp,
                enemyHp: enemyHp,
            }),
        });

        console.log("Données envoyées à update_stats.php :", {
            playerId: 1, 
            playerHp: playerHp, 
            enemyHp: enemyHp
        });
        

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
            console.log("Les statistiques ont été mises à jour dans la base de données.");
        } else {
            console.error("Erreur lors de la mise à jour des statistiques :", data.message);
        }
    } catch (error) {
        console.error("Erreur lors de l'appel à update_stats.php :", error);
    }

    // Mettre à jour l'affichage des HP
    console.log("Appel de updateHpDisplay avec :", {
        playerHp,
        enemyHp
    });
    
    updateHpDisplay(playerHp, enemyHp);

    console.log("Appel de checkEnemyDefeat avec enemyHp =", enemyHp);
    checkEnemyDefeat(enemyHp);  // Vérifie si l'ennemi est vaincu
    console.log("checkEnemyDefeat exécuté avec enemyHp =", enemyHp);


    // Récupérer les HP actuels et maximum de l'ennemi depuis l'interface
    const enemyHealthBar = document.querySelector('.health-bar .health-fill.enemy');
    let maxHp = 0;

    if (enemyHealthBar) {
        maxHp = parseInt(enemyHealthBar.dataset.maxHp);

        // Récupération de l'effet de dégâts depuis l'attribut HTML
        const damageEffectType = document.querySelector('.enemy-image').getAttribute('data-damage-effect');

        // Ajout du log , juste après la récupération de l'effet
        console.log("Effet de dégâts récupéré :", damageEffectType);

        // Appliquer l'effet de dégâts sur l'ennemi
        applyDamageEffect(enemyHp, maxHp, damageEffectType);
    }

    // Applique un tremblement à l'image de l'ennemi    
    const enemyElement = document.querySelector('.enemy-image img');
    applyShakeEffect(enemyElement);
    console.log("Effet de tremblement appliqué sur l'ennemi après l'attaque.");

    // Appliquer l'effet de clignotement rouge si HP bas
    applyLowHpBlinkEffect(enemyHp, maxHp);

    
    // Ajouter les logs
    addToCombatLog(`Tour ${roundCounter} : Vous avez infligé ${playerDamage} dégâts à l'ennemi. Il lui reste ${enemyHp} HP.`, 'player');
    addToCombatLog(`Tour ${roundCounter} : L'ennemi vous a infligé ${enemyDamage} dégâts. Il vous reste ${playerHp} HP.`, 'enemy');

    // Vérifier les conditions de victoire ou défaite
    if (enemyHp <= 0) {
        addToCombatLog("L'ennemi est vaincu !");
        updateHpDisplay(playerHp, enemyHp);
        resetRoundCounter();
        attackButton.disabled = false; // Réactiver le bouton pour de futurs combats
        return;
    }

    if (playerHp <= 0) {
        addToCombatLog("Vous avez été vaincu !");
        updateHpDisplay(playerHp, enemyHp);
        resetRoundCounter();
        attackButton.disabled = false; // Réactiver le bouton pour de futurs combats
        return;
    }

    // Réactiver le bouton "Attack" après la mise à jour
    attackButton.disabled = false;

   /* // Vérifier si le combat atteint 6 rounds
    if (roundCounter === 6) {
        displayCombatDecisionModal();
    }*/
}

// Réinitialiser le compteur de rounds après la fin d’un combat
function resetRoundCounter() {
    roundCounter = 0;
}

// Tableau pour enregistrer tous les logs
const combatLogs = [];

// Fonction pour afficher le Combat Log
function showCombatLog() {
    const combatLog = document.getElementById('combat-log');
    if (combatLog.style.display === 'none') {
        combatLog.style.display = 'block';
    }
}

// Fonction pour ajouter un message au Combat Log
function addToCombatLog(message, type) {
    combatLogs.push({ message, type }); // On enregistre le message avec son type (player/enemy)

    const combatLogCurrent = document.getElementById('combat-log-current');
    const logClass = type === 'player' ? 'player-log' : 'enemy-log';
    combatLogCurrent.innerHTML = combatLogs
        .slice(-2) // Garde uniquement les deux derniers logs
        .map(log => `<span class="${log.type === 'player' ? 'player-log' : 'enemy-log'}">${log.message}</span>`)
        .join('<br>');
}

// Gestion de l'affichage complet des logs
document.getElementById('show-logs-button').style.display = 'none'; // Masquer par défaut

document.getElementById('show-logs-button').addEventListener('click', () => {
    const logsModal = document.getElementById('logs-modal');
    const logsContainer = document.getElementById('all-logs-container');

    logsContainer.innerHTML = ''; // On nettoie les logs existants avant d'afficher
    combatLogs.forEach(log => {
        const logItem = document.createElement('li');
        logItem.className = log.type === 'player' ? 'player-log' : 'enemy-log';
        logItem.textContent = log.message;
        logsContainer.appendChild(logItem);
    });

    logsModal.classList.add('show'); // Affiche le modal des logs
});