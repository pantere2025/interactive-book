// Variable pour stocker les données en cache
let sessionData = null;

// Fonction pour charger les données de session au démarrage
function loadSessionData() {
    return fetch('get_session_data.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.stats && data.inventory) {
                sessionData = data; // Met en cache les données
                console.log("Session data loaded:", sessionData);
            } else {
                console.error("Session data incomplete or missing:", data);
                console.error("Erreur : Impossible de charger les données de la session. Veuillez réessayer.");
            }
            
        })
        .catch(error => {
            console.error("Error loading session data:", error);
        });
}

// Fonction pour afficher un message temporaire dans le modal de l'inventaire
function displayInventoryMessage(message, isSuccess = true) {
    const feedbackDiv = document.querySelector('.inventory-feedback');
    
    if (!feedbackDiv) {
        console.error("No .inventory-feedback element found!");
        return;
    }
    feedbackDiv.textContent = message; // Affiche le message exact reçu
    feedbackDiv.style.color = isSuccess ? 'green' : 'red';
    feedbackDiv.style.display = 'block';

    // Cache le message après 3 secondes
    setTimeout(() => {
        feedbackDiv.style.display = 'none';
    }, 3000);
}

// Fonction pour appliquer une animation visuelle autour de l'objet utilisé
function highlightItem(itemId, isSuccess, message = null) {
    const itemElement = document.getElementById(`item-${itemId}`);
    if (itemElement) {
        const highlightClass = isSuccess ? 'highlight-success' : 'highlight-fail';
        const effectElement = itemElement.querySelector('.item-effect');

        if (effectElement) {
            // Utiliser le message réel ou le texte par défaut
            const originalEffectText = effectElement.textContent;
            effectElement.textContent = message || (isSuccess
                ? "Effect applied successfully!"
                : "Cannot be used!");
            effectElement.style.color = isSuccess ? 'green' : 'red';

            // Remet le texte original après 1,5 seconde
            setTimeout(() => {
                effectElement.textContent = originalEffectText;
                effectElement.style.color = '';
            }, 1500);
        }

        // Ajout de la bordure clignotante
        itemElement.classList.add(highlightClass);
        setTimeout(() => {
            itemElement.classList.remove(highlightClass);
        }, 1500);
    } else {
        console.error("Item element not found for ID:", itemId);
    }
}

// Fonction pour mettre à jour les statistiques locales
function updateLocalStats(newStats) {
    // Met à jour le cache local
    if (!sessionData || !sessionData.stats) {
        console.error("No session data to update!");
        return;
    }

    sessionData.stats = { ...sessionData.stats, ...newStats };
    console.log("Local stats updated:", sessionData.stats);

    // Met à jour l'affichage visible sur la page
    const hpElement = document.querySelector('.stat-box .hp');
    const strengthElement = document.querySelector('.stat-box .strength');
    const enduranceElement = document.querySelector('.stat-box .endurance');
    
    if (hpElement) {
        hpElement.textContent = `HP: ${sessionData.stats.health}`;
    } else {
        console.error("Erreur : Élément '.stat-box .hp' introuvable.");
    }
    
    if (strengthElement) {
        strengthElement.textContent = `Strength: ${sessionData.stats.strength}`;
    } else {
        console.error("Erreur : Élément '.stat-box .strength' introuvable.");
    }
    
    if (enduranceElement) {
        enduranceElement.textContent = `Endurance: ${sessionData.stats.endurance}`;
    } else {
        console.error("Erreur : Élément '.stat-box .endurance' introuvable.");
    }
    if (defenseElement) {
        defenseElement.textContent = `Defense: ${sessionData.stats.defense}`; // Mise à jour dynamique de defense
    } else {
        console.error("Erreur : Élément '.stat-box .defense' introuvable.");
    }
    
    
}

// Fonction pour utiliser un objet
function useItem(itemId) {
    fetch(`use_item.php?item_id=${itemId}`)
        .then(response => response.json())
        .then(data => {
            console.log("Données reçues du backend:", data);  // Ajout du log
            console.log("Backend message:", data.message); // Debugging

            console.log("=== Données de l'inventaire après utilisation de l'objet ===");

            if (!data.stats || typeof data.stats.health === 'undefined' || typeof data.stats.max_health === 'undefined') {
                console.warn("Attention : les données de santé du joueur sont manquantes ou incomplètes !");
                data.stats = {
                    health: sessionData?.stats?.health || 100,
                    max_health: sessionData?.stats?.max_health || 100
                };
            } else {
                console.log(`HP Joueur reçus correctement : ${data.stats.health} / ${data.stats.max_health}`);
            }
            
            
            if (!data.stats || typeof data.stats.enemy_hp === 'undefined' || typeof data.stats.enemy_max_hp === 'undefined') {
                console.warn("Attention : les données de l'ennemi sont manquantes ou incomplètes !");
                data.stats.enemy_hp = sessionData?.stats?.enemy_hp ?? 150;
                data.stats.enemy_max_hp = sessionData?.stats?.enemy_max_hp ?? 150;
            } else {
                console.log(`HP Ennemi reçus correctement : ${data.stats.enemy_hp} / ${data.stats.enemy_max_hp}`);
            }
            
           
            console.log(`HP Joueur reçus : ${data.stats.health} / ${data.stats.max_health}`);
            if (data.stats && typeof data.stats.enemy_hp !== 'undefined' && typeof data.stats.enemy_max_hp !== 'undefined') {
                console.log(`HP Ennemi reçus correctement : ${data.stats.enemy_hp} / ${data.stats.enemy_max_hp}`);
            } else {
                console.warn("Attention : les HP de l'ennemi sont manquants dans la réponse du backend.");
            }
            
            console.log("=== Fin des données de l'inventaire ===");

            console.log("Données complètes reçues du backend:", data);

            // Vérification si la compétence est au maximum
            if (!data.success && data.message.includes("Health already at maximum")) {
                console.log("Affichage d'un message d'erreur pour santé maximale.");
                displayInventoryMessage("Health already at maximum!", false);
                highlightItem(itemId, false, "Health already at maximum!");
                return; // Stopper l'exécution
            }
            

            if (data.success) {
                // Affiche un cadre vert pour les succès
                displayInventoryMessage(data.message, true);
                highlightItem(itemId, true);
                sessionData.inventoryModified = true; // Marque l'inventaire comme modifié

              // Ajout du log pour vérifier les stats reçues du backend
              console.log("Response from backend (success):", data.stats);
              

              console.log(`Utilisation de l'objet ${itemId}, mise à jour HP : ${data.stats.health}/${data.stats.max_health}`);

                // Met à jour dynamiquement la quantité de l'objet
                const itemElement = document.getElementById(`item-${itemId}`);
                if (itemElement) {
                    const quantityElement = itemElement.querySelector('.item-quantity');
                    if (quantityElement) {
                        const currentQuantity = parseInt(quantityElement.textContent);
                        if (currentQuantity > 1) {
                            quantityElement.textContent = `${currentQuantity - 1}x`;
                        } else {
                            itemElement.classList.add('disabled'); // Rend l'objet grisé
                            quantityElement.textContent = '0x'; // Met à jour la quantité à zéro
                            const button = itemElement.querySelector('button');
                            if (button) {
                                button.disabled = true; // Désactive le bouton
                            }
                        }
                    } else {
                        console.error(".item-quantity element not found for item:", itemId);
                    }
                } else {
                    console.error("Item element not found for ID:", itemId);
                }

                // Mettre à jour les statistiques locales et l'affichage
                if (data.stats) {
                    updateLocalStats(data.stats);
                    updateHealthBar('.stat-box .health-bar', data.stats.health, data.stats.max_health); // Met à jour dynamiquement la barre de vie
                    // Ajout d'un log pour vérifier les stats après mise à jour locale
                    console.log("Stats after updateLocalStats:", sessionData.stats);
                    console.log(`Statistiques après mise à jour : HP=${sessionData.stats.health}, MaxHP=${sessionData.stats.max_health}`);

                    console.log("Updated sessionData:", sessionData); // log pour console
                
// Recharger les statistiques après utilisation d'un objet
fetch('get_character_stats.php')
    .then(response => response.json())
    .then(data => {
        if (data.success && data.stats) {
            updateLocalStats(data.stats);
            console.log("Stats reloaded after using item:", data.stats);

                        // Ajouter les nouveaux logs ici
                        console.log("Données reçues de get_character_stats.php :", data.stats);
                        console.log("Stats pour mise à jour :", {
                            currentHp: data.stats.health,
                            maxHp: data.stats.max_health,
                        });
        } else {
            console.error("Failed to reload stats:", data.message);
            console.error("Erreur : Impossible de mettre à jour les statistiques.");
        }
    })
    .catch(error => {
        console.error("Error reloading stats:", error);
        console.error("Erreur lors de la mise à jour des statistiques.");
    });
                
                }

            } else {    
                // Gestion des échecs génériques
                displayInventoryMessage(data.message, false);
                highlightItem(itemId, false);
            }
        })
        .catch(error => {
            console.error('Error using item:', error);
            displayInventoryMessage("An error occurred while using the item.", false);
        });
}

// Fonction pour ouvrir l'inventaire
function openInventory() {
    const modal = document.getElementById("inventory-modal");
    if (modal) {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
    } else {
        console.error("Inventory modal not found!");
    }
}

// Fonction pour fermer l'inventaire et mettre à jour les stats
function closeInventory() {
    const modal = document.getElementById("inventory-modal");
    if (modal) {
        modal.classList.add("fade-out");
        setTimeout(() => {
            modal.style.display = "none";
            modal.classList.remove("fade-out");
            document.body.style.overflow = "auto"; // Réactiver le défilement de la page

            // Ne recharge les statistiques que si un changement a eu lieu
            if (sessionData && sessionData.inventoryModified) {
                console.log("Fermeture de l'inventaire : appel à refreshHealthBars(), valeurs avant mise à jour :", sessionData.stats);

                refreshHealthBars(); // Mettre à jour les barres de vie dynamiquement
                sessionData.inventoryModified = false;
                fetch('get_character_stats.php')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success && data.stats) {
                            console.log('Données reçues pour mise à jour des barres de vie :', data.stats);
                            updateLocalStats(data.stats); // Met à jour uniquement les statistiques locales
                            console.log("Appel à refreshHealthBars après mise à jour des stats.");
                            
                        } else {
                            console.error("Échec de la mise à jour des stats :", data.message);
                        }
                    })
                    .catch(error => console.error("Erreur lors de la synchronisation des stats :", error));
                
                // Réinitialise le drapeau de modification
                
            }
        }, 500);
    } else {
        console.error("Inventory modal not found!");
    }
}

// Charger les données de session au démarrage
document.addEventListener("DOMContentLoaded", () => {
    loadSessionData();
});
