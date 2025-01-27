// Fonction pour afficher les dés avec animation sur 2 cycles et résultats finaux
function showDiceAnimation() {
    const diceContainer = document.querySelector('.dice-results');

    // Réinitialisation des dés
    diceContainer.style.display = 'flex';
    diceContainer.innerHTML = `
        <div class="player-dice">
            <h3>Your Roll: <span>?</span></h3>
            <img class="dice" src="../images/dice/dice-face-1.png" alt="Player Dice">
            <img class="dice" src="../images/dice/dice-face-2.png" alt="Player Dice">
        </div>
        <div class="combat-shield">
            <img class="shield" src="../images/combat-shield.png" alt="Shield">
        </div>
        <div class="enemy-dice">
            <h3>Enemy Roll: <span>?</span></h3>
            <img class="dice" src="../images/dice/dice-face-red-1.png" alt="Enemy Dice">
            <img class="dice" src="../images/dice/dice-face-red-2.png" alt="Enemy Dice">
        </div>
    `;

    const playerDiceImages = diceContainer.querySelectorAll('.player-dice img');
    const enemyDiceImages = diceContainer.querySelectorAll('.enemy-dice img');
    const playerRollSpan = diceContainer.querySelector('.player-dice h3 span');
    const enemyRollSpan = diceContainer.querySelector('.enemy-dice h3 span');

    // Simulation des résultats des dés
    const playerDice = Array(2).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
    const enemyDice = Array(2).fill(0).map(() => Math.floor(Math.random() * 6) + 1);

    // Animation des dés
    let cycleCount = 0;
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            cycleCount++;

            // Afficher des faces aléatoires pendant l'animation
            playerDiceImages.forEach(img => {
                img.src = `../images/dice/dice-face-${Math.floor(Math.random() * 6) + 1}.png`;
            });
            enemyDiceImages.forEach(img => {
                img.src = `../images/dice/dice-face-red-${Math.floor(Math.random() * 6) + 1}.png`;
            });

            if (cycleCount >= 2) {
                // Arrêter l'animation après 2 cycles
                clearInterval(interval);

                // Calculer les résultats finaux
                const playerResult = playerDice.reduce((sum, val) => sum + val, 0);
                const enemyResult = enemyDice.reduce((sum, val) => sum + val, 0);
                console.log("Résultats des dés :", { playerResult, enemyResult });
                // Mettre à jour les images avec les résultats finaux
                playerDiceImages.forEach((img, index) => {
                    img.src = `../images/dice/dice-face-${playerDice[index]}.png`;
                    img.classList.add('stop-animation'); // Arrêter l'animation
                });
                enemyDiceImages.forEach((img, index) => {
                    img.src = `../images/dice/dice-face-red-${enemyDice[index]}.png`;
                    img.classList.add('stop-animation'); // Arrêter l'animation
                });

                // Mettre à jour les résultats finaux dans le texte
                playerRollSpan.textContent = playerResult; // Mettre à jour Your Roll
                enemyRollSpan.textContent = enemyResult;   // Mettre à jour Enemy Roll
                playerRollSpan.style.visibility = 'visible';
                enemyRollSpan.style.visibility = 'visible';

                resolve({ playerResult, enemyResult });
            }
        }, 500); // Chaque cycle dure 500ms
    });
}

// Fonction pour ajouter une animation de shake sur l'ennemi lors des dégâts
function applyShakeEffect(enemyElement) {
    if (enemyElement) {
        enemyElement.classList.add('shake-effect');
        setTimeout(() => {
            enemyElement.classList.remove('shake-effect');
        }, 300);
    } else {
        console.error("L'élément de l'ennemi n'a pas été trouvé pour l'effet de tremblement.");
    }
}

/**
 * Applique un effet visuel de dégâts progressif en fonction des HP restants de l'ennemi.
 * 
 * @param {number} enemyHp - Les HP actuels de l'ennemi.
 * @param {number} maxHp - Les HP maximum de l'ennemi.
 * @param {string} damageEffectType - Le type d'effet visuel défini dans la base de données.
 */
function applyDamageEffect(enemyHp, maxHp, damageEffectType) {
    const damageOverlay = document.querySelector('.damage-overlay');

    if (!damageOverlay) {
        console.error("Erreur: L'élément '.damage-overlay' est introuvable !");
        return;
    }
    if (enemyHp <= 0) {
        damageOverlay.style.opacity = 0;  // Masquer définitivement l'overlay
        console.log("Overlay de dégâts supprimé définitivement après la défaite.");
        return;
    }

    let effectImage = '';
    switch (damageEffectType) {
        case 'blood-effect':
            effectImage = '../images/effects/blood_splatter.png';
            break;
        case 'crack-effect':
            effectImage = '../images/effects/crack_splatter.png';
            break;
        case 'darkness-effect':
            effectImage = '../images/effects/darkness_overlay.png';
            break;
        default:
            console.warn("Aucun effet défini pour ce type d'ennemi :", damageEffectType);
            return;
    }

    // Appliquer l'image de l'effet sélectionné en arrière-plan
    damageOverlay.style.backgroundImage = `url(${effectImage})`;

    // Inversion du calcul : plus les HP diminuent, plus l'opacité augmente
    const damagePercentage = 1 - (enemyHp / maxHp); 
    damageOverlay.style.opacity = Math.min(damagePercentage * 0.85, 0.85); // Va jusqu'à 85% max de visibilité

    // Ajout d'un léger flou pour renforcer l'effet progressif
    damageOverlay.style.filter = `blur(${damagePercentage * 3}px) brightness(${1 - (damagePercentage / 3)})`;

    console.log(`Effet appliqué : ${damageEffectType}, Opacité : ${damageOverlay.style.opacity}`);
}

/**
 * Applique un effet de clignotement rouge progressif à l'ennemi lorsque ses HP sont faibles.
 * L'effet commence à apparaître lorsque les HP sont inférieurs ou égaux à 20% du max.
 */
function applyLowHpBlinkEffect(enemyHp, maxHp) {
    const enemyContainer = document.querySelector('.enemy-image');

    if (!enemyContainer) {
        console.error("L'élément de l'ennemi est introuvable pour l'effet de clignotement rouge.");
        return;
    }

    // Définition des seuils de HP
    const slowThreshold = maxHp * 0.2;  // 20% du max
    const fastThreshold = maxHp * 0.1;  // 10% du max

    // Supprime les classes existantes pour éviter les conflits
    enemyContainer.classList.remove('slow', 'fast', 'red-blink-effect');

    if (enemyHp <= fastThreshold && enemyHp > 0) {

        // Appliquer l'effet de clignotement rapide si HP <= 10%
        enemyContainer.classList.add('red-blink-effect', 'fast');
        console.log("Effet de clignotement rapide appliqué (HP très faibles).");
    } else if (enemyHp <= slowThreshold) {
        // Appliquer l'effet de clignotement lent si HP <= 20% mais >10%
        enemyContainer.classList.add('red-blink-effect', 'slow');
        console.log("Effet de clignotement lent appliqué (HP faibles).");
    } else {
        console.log("HP suffisants, aucun effet appliqué.");
    }
}

/**
 * Applique un effet de dissolution sur l'image de l'ennemi lors du coup fatal.
 * L'animation supprime également les autres effets visuels (clignotement, overlay).
 */
function applyFatalBlowEffect() {
    const enemyImage = document.querySelector('.enemy-image img');
    const enemyContainer = document.querySelector('.enemy-image');
    const damageOverlay = document.querySelector('.damage-overlay');

    if (!enemyImage || !enemyContainer || !damageOverlay) {
        console.log("Avant suppression des effets : ", enemyContainer.classList);

        console.error("Erreur : Élément de l'ennemi ou overlay introuvable pour l'effet de dissolution.");
        return;
    }

    console.log("Forçage de l'arrêt des animations...");

    // Désactiver complètement les animations et transitions
    enemyContainer.style.animation = 'none';
    enemyContainer.style.transition = 'none';
    enemyContainer.classList.remove('red-blink-effect', 'slow', 'fast');
    damageOverlay.style.transition = 'none';
    damageOverlay.style.opacity = '0';
    damageOverlay.style.display = 'none';

    // Appliquer l'effet de dissolution
    console.log("Après suppression des effets : ", enemyContainer.classList);

    enemyImage.classList.add('dissolve');

    setTimeout(() => {
        enemyImage.style.display = 'none';
        console.log("Image de l'ennemi cachée après dissolution.");
    }, 1500);
}

