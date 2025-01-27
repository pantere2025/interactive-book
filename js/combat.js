function refreshHealthBars() {
    fetch('get_character_stats.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.stats) {
                console.log("Données reçues pour mise à jour des barres de vie :", data.stats);

                if (!data.stats.enemy_hp || !data.stats.enemy_max_hp) {
                    console.error("Erreur : Données HP ennemies manquantes ou indéfinies ! Données reçues :", data);
                    return;
                }

                if (typeof data.stats.enemy_hp === 'undefined' || typeof data.stats.enemy_max_hp === 'undefined') {
                    console.error("Erreur : enemyHp ou enemyMaxHp est indéfini. Vérifie la source des données.");
                    return;
                }

                console.log("Valeurs exactes après vérification :", {
                    playerHp: data.stats.health,
                    playerMaxHp: data.stats.max_health,
                    enemyHp: data.stats.enemy_hp,
                    enemyMaxHp: data.stats.enemy_max_hp
                });

                // Mettre à jour la barre de vie du joueur
                const playerBar = document.getElementById('player-health-bar');
                if (playerBar) {
                    const playerHpPercentage = (data.stats.health / data.stats.max_health) * 100;
                    playerBar.style.width = `${playerHpPercentage}%`;
                    playerBar.className = 'health-fill player';
                    if (playerHpPercentage <= 25) {
                        playerBar.classList.add('low-health');
                    } else if (playerHpPercentage <= 50) {
                        playerBar.classList.add('medium-health');
                    }
                }

                // Mettre à jour la barre de vie de l'ennemi (si applicable)
                const enemyBar = document.getElementById('enemy-health-bar');
                if (enemyBar) {
                    const enemyHpPercentage = (data.stats.enemy_hp / data.stats.enemy_max_hp) * 100;
                    enemyBar.style.width = `${enemyHpPercentage}%`;
                    enemyBar.className = 'health-fill enemy';
                    if (enemyHpPercentage <= 25) {
                        enemyBar.classList.add('low-health');
                    } else if (enemyHpPercentage <= 50) {
                        enemyBar.classList.add('medium-health');
                    }
                }
            } else {
                console.error("Erreur : Données de barre de vie non valides :", data.message);
            }
        })
        .catch(error => console.error("Erreur lors de la récupération des données des barres de vie :", error));
}

// Fonction utilitaire pour mettre à jour la largeur de la barre de vie
function updateHealthBar(selector, currentHp, maxHp) {
    const healthBar = document.querySelector(selector);
    if (!healthBar) {
        console.error("Aucune healthBar trouvée avec le sélecteur :", selector);
        return;
    }
    const healthFill = healthBar.querySelector('.health-fill');
    if (healthFill) {
        const percentage = (currentHp / maxHp) * 100;
        healthFill.style.width = `${percentage}%`;
        healthFill.className = 'health-fill';
        if (percentage <= 25) {
            healthFill.classList.add('low-health');
        } else if (percentage <= 50) {
            healthFill.classList.add('medium-health');
        }
    } else {
        console.error("Élément .health-fill introuvable dans :", selector);
    }
}

// Ajouter un événement au bouton Attack
document.querySelector('button.attack').addEventListener('click', function() {
    attack();
    document.getElementById('all-logs-container').innerHTML += '<p>Attaque effectuée : dégâts infligés.</p>';
});
