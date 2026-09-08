#!/usr/bin/env node
/**
 * Cree un compte utilisateur local (technicien ou administrateur).
 *
 * Usage :
 *   npm run create-user -- <nom_utilisateur> <mot_de_passe> [nom_affiche] [role]
 *
 * Exemple :
 *   npm run create-user -- j.dupont "MotDePasse123!" "Jean Dupont" technicien
 *
 * Il n'existe volontairement pas de route HTTP publique de creation de
 * compte : seule une personne ayant acces au serveur (ligne de commande)
 * peut creer des utilisateurs, ce qui evite toute inscription sauvage si
 * l'API est exposee sur un reseau partage.
 */
import { createUser } from "../src/services/userService.js";
import { assertAuthConfigured } from "../src/config/env.js";

async function main() {
  const missing = assertAuthConfigured();
  if (missing.length) {
    console.error(`Configuration manquante avant de créer un utilisateur : ${missing.join(", ")}`);
    console.error("Renseignez backend/.env (voir .env.example) puis réessayez.");
    process.exit(1);
  }

  const [username, password, displayName, role] = process.argv.slice(2);

  if (!username || !password) {
    console.error("Usage : npm run create-user -- <nom_utilisateur> <mot_de_passe> [nom_affiche] [role]");
    process.exit(1);
  }

  try {
    await createUser({
      username,
      password,
      displayName: displayName || username,
      role: role === "admin" ? "admin" : "technicien",
    });
    console.log(`✅ Utilisateur '${username}' créé avec succès.`);
  } catch (err) {
    console.error(`❌ ${err.message || err}`);
    process.exit(1);
  }
}

main();
