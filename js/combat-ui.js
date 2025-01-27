// Fonction pour mettre à jour la barre de vie
function updateHealthBar(selector, currentHp, maxHp) {
    console.log("updateHealthBar appelé avec :", { selector, currentHp, maxHp }); // Log pour débogage

    // Sélectionne l'élément de la barre de vie
    const healthBar = document.querySelector(selector);

    if (healthBar) {
        // Calcule le pourcentage de HP restant
        const hpPercentage = (currentHp / maxHp) * 100;

        // Met à jour la largeur de la barre de vie
        healthBar.style.width = `${hpPercentage}%`;

        // Change la couleur en fonction du pourcentage de HP
        healthBar.className = 'health-fill'; // Réinitialise les classes
        console.log(`Nouvelle classe CSS appliquée à ${selector}:`, healthBar.className);

        if (hpPercentage <= 25) {
            healthBar.classList.add('low-health');
        } else if (hpPercentage <= 50) {
            healthBar.classList.add('medium-health');
        }

        console.log(`Mise à jour de ${selector} : ${hpPercentage}%`); // Vérifie le changement visuel
    } else {
        console.error(`Élément non trouvé pour le sélecteur : ${selector}`);
    }
}

// Fonction pour mettre à jour les HP affichés et les barres de vie
function updateHpDisplay(playerHp, enemyHp) {
    // Mise à jour des HP du joueur
    document.querySelector('.hp').textContent = `HP: ${playerHp}`;
    const playerHealthBar = document.querySelector('.health-bar .health-fill.player');
    if (playerHealthBar) {
        const playerMaxHp = parseInt(playerHealthBar.dataset.maxHp);
        if (playerHp > playerMaxHp) {
            console.warn("Attention : Les HP du joueur dépassent le maximum, correction appliquée.");
            playerHp = playerMaxHp;
        }
        
        const playerHpPercentage = (playerHp / playerMaxHp) * 100;
        if (playerHpPercentage > 100) {
            console.warn("Correction appliquée : Le pourcentage de HP du joueur dépassait 100%");
            playerHpPercentage = 100;
        }
        
        playerHealthBar.style.width = `${playerHpPercentage}%`;
        playerHealthBar.className = 'health-fill player';
        if (playerHpPercentage <= 25) {
            playerHealthBar.classList.add('low-health');
        } else if (playerHpPercentage <= 50) {
            playerHealthBar.classList.add('medium-health');
        }
    }

    // Logs pour le joueur
    console.log("Player HP:", playerHp, "Max HP:", playerHealthBar?.dataset.maxHp);

    // Mise à jour des HP de l'ennemi
    document.querySelector('.enemy-hp').textContent = `HP: ${enemyHp}`;
    const enemyHealthBar = document.querySelector('.health-bar .health-fill.enemy');
    console.log('Vérification DOM : data-max-hp de la barre de vie ennemi :', enemyHealthBar.dataset.maxHp);

    console.log("Enemy health bar found:", !!enemyHealthBar); // Vérifie si la barre est trouvée

    
    if (enemyHealthBar) {
        const enemyMaxHp = parseInt(enemyHealthBar.dataset.maxHp);
        if (enemyHp > enemyMaxHp) {
            console.error("Correction des HP de l'ennemi détectée, ajustement en cours.");
            enemyHp = enemyMaxHp;
        }
        console.log("Mise à jour correcte des HP ennemis :", enemyHp, "/", enemyMaxHp);
        
        console.log('Vraie valeur enemyMaxHp après correction :', enemyMaxHp);

        console.log('Données max HP de l\'ennemi depuis la barre de vie :', enemyMaxHp);

        console.log("Enemy max HP:", enemyMaxHp); // Vérifie max HP
        console.log(`Enemy current HP: ${enemyHp}`); // Vérifie la valeur actuelle des HP de l'ennemi
        
        if (typeof enemyHp === "undefined" || typeof enemyMaxHp === "undefined") {
            console.error("Erreur : les valeurs de HP de l'ennemi sont indéfinies. Vérifie la source des données.");
        }
        
        console.log('HP ennemi avant mise à jour :', { currentHp: enemyHp, maxHp: enemyMaxHp });
        enemyHp = Math.max(0, enemyHp); // S'assure que les HP ennemis ne sont pas négatifs

        let enemyHpPercentage = Math.min(100, (enemyHp / enemyMaxHp) * 100);

        console.log("Enemy HP percentage:", enemyHpPercentage); // Vérifie le pourcentage
        if (!isNaN(enemyHpPercentage) && enemyHpPercentage <= 100) {
            if (enemyHpPercentage < 0) {
                console.warn("Correction appliquée : Les HP de l'ennemi sont négatifs, ajustement à 0.");
                enemyHpPercentage = 0;
            }
            
            enemyHealthBar.style.width = `${enemyHpPercentage}%`;
            console.log(`Vérification finale de la barre de vie ennemi : largeur = ${enemyHealthBar.style.width}, HP = ${enemyHp}, Max HP = ${enemyMaxHp}`);

            console.log(`Mise à jour barre ennemi : HP=${enemyHp} / MaxHP=${enemyMaxHp} -> ${enemyHpPercentage}%`);

            // Ajouter ici le log de confirmation après la mise à jour des barres de vie
        console.log("Mise à jour confirmée des barres de vie :");
        console.log(`- Player HP: ${playerHp}/${playerHealthBar?.dataset.maxHp || 100}`);
        console.log(`- Enemy HP: ${enemyHp}/${enemyHealthBar?.dataset.maxHp || 100}`);
        } else {
            console.error("Valeur incorrecte détectée pour la barre de vie de l'ennemi :", enemyHpPercentage);
        }
        
        enemyHealthBar.className = 'health-fill enemy';
        if (enemyHpPercentage <= 25) {
            enemyHealthBar.classList.add('low-health');
        } else if (enemyHpPercentage <= 50) {
            enemyHealthBar.classList.add('medium-health');
        }
    } else {
        console.error("Enemy health bar not found or inaccessible.");
    }
     // Ajouter ici les logs de confirmation après la mise à jour des barres de vie
     console.log("Mise à jour des barres de vie terminée avec succès.");
     console.log(`- Player HP: ${playerHp}/${playerHealthBar?.dataset.maxHp || 100}`);
     console.log(`- Enemy HP: ${enemyHp}/${enemyHealthBar?.dataset.maxHp || 100}`);
}

/*// Fonction pour afficher le modal de décision après 6 rounds
function displayCombatDecisionModal() {
    // Récupérer le modal prédéfini
    const modal = document.getElementById('flee-modal');

    // Afficher le modal en ajoutant la classe 'show'
    if (modal) {
        modal.classList.add('show');
    }

    // Gestion des clics sur "Continuer"
    document.getElementById('continue-fight').addEventListener('click', () => {
        modal.classList.remove('show'); // Fermer le modal
        addToCombatLog("Vous avez choisi de continuer à vous battre.", 'player'); // Log correct
    });

    // Gestion des clics sur "Fuir"
    document.getElementById('flee-fight').addEventListener('click', () => {
        addToCombatLog("Vous avez choisi de fuir le combat.", 'enemy');
        modal.classList.remove('show'); // Fermer le modal

        // Redirection ou logique pour fuir
        window.location.href = 'escape.php'; // Exemple de redirection vers une page dédiée
    });
}
*/

// Fonction pour afficher le modal de victoire avec un délai
function showVictoryModal() {
    console.log("La fonction showVictoryModal a été appelée.");

    // Sélectionne le modal par son ID
    const modal = document.getElementById('combat-end-modal');

    // Vérifie si le modal existe avant de l'afficher
    if (modal) {
        console.log("Affichage du modal dans 2 secondes...");
        setTimeout(() => {
            modal.classList.remove('hidden');  // Retire la classe cachée au lieu de modifier le style
            console.log("Modal de victoire affiché.");
        }, 2000);  // Délai de 2 secondes
    } else {
        console.error("Erreur : l'élément #combat-end-modal est introuvable dans le DOM.");
    }
}



// Fonction pour gérer la défaite de l'ennemi
function checkEnemyDefeat(enemyHp) {
    if (enemyHp <= 0) {
        console.log("L'ennemi est vaincu, suppression des effets visuels et application de l'effet de dissolution.");

        // Sélection des éléments
        const enemyContainer = document.querySelector('.enemy-image');
        const enemyImage = document.querySelector('.enemy-image img');
        const damageOverlay = document.querySelector('.damage-overlay');

        if (enemyContainer && enemyImage) {
            // Suppression agressive de toutes les classes d'effet visuel
            console.log("Suppression des effets de clignotement rouge.");
            enemyContainer.classList.remove('red-blink-effect', 'slow', 'fast');
            enemyImage.classList.remove('red-blink-effect', 'fast', 'slow');

            // Ajout de vérification et suppression supplémentaire après un délai
            setTimeout(() => {
                if (enemyContainer.classList.contains('red-blink-effect')) {
                    enemyContainer.classList.remove('red-blink-effect');
                    console.log("Suppression forcée de red-blink-effect.");
                }
            }, 500);

            // Arrêter les animations de clignotement et overlay de dégâts
            clearInterval(window.enemyBlinkingEffect);
            enemyContainer.style.animation = 'none';
            enemyImage.style.animation = 'none';

            if (damageOverlay) {
                damageOverlay.style.animation = 'none';
                console.log("Animations de clignotement et overlay de dégâts arrêtées.");
                damageOverlay.style.transition = 'opacity 0.5s ease-out';
                damageOverlay.style.opacity = '0';
            }

            // Appliquer l'effet de disparition (coup fatal) après suppression des effets
            setTimeout(() => {
                enemyImage.classList.add('enemy-defeated');
                console.log("Effet de coup de grace appliqué à l'ennemi.");
            }, 300);

            // Afficher le modal après l'animation de dissolution
            setTimeout(() => {
                showVictoryModal();
            }, 1800);
        } else {
            console.error("Image de l'ennemi ou conteneur introuvable dans le DOM.");
            showVictoryModal();
        }

        // Désactiver les boutons d'action
        const attackButton = document.getElementById('attack-button');
       /*  const dodgeButton = document.querySelector('.dodge');  */
        const fleeButton = document.querySelector('.flee');

        if (attackButton) {
            attackButton.disabled = true;
            console.log("Bouton Attack désactivé.");
        }
       /* if (dodgeButton) {
            dodgeButton.disabled = true;
            console.log("Bouton Dodge désactivé.");
        }*/
        if (fleeButton) {
            fleeButton.disabled = true;
            console.log("Bouton Flee désactivé.");
        }
    }
}
