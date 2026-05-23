#!/bin/bash
# setup.sh — Installation et démarrage local de 2Cheries
# Usage: chmod +x setup.sh && ./setup.sh

set -e

BOLD="\033[1m"
GREEN="\033[0;32m"
GOLD="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo ""
echo -e "${GOLD}${BOLD}╔══════════════════════════════════╗${RESET}"
echo -e "${GOLD}${BOLD}║       2Cheries — Setup Local     ║${RESET}"
echo -e "${GOLD}${BOLD}╚══════════════════════════════════╝${RESET}"
echo ""

# ── Vérifier Node.js ──────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js n'est pas installé. Installez Node.js ≥ 18.${RESET}"
  exit 1
fi
NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 18 ]; then
  echo -e "${RED}❌ Node.js ≥ 18 requis. Version actuelle : $(node -v)${RESET}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v) détecté${RESET}"

# ── Vérifier PostgreSQL ───────────────────────────────────
if ! command -v psql &> /dev/null; then
  echo -e "${RED}❌ PostgreSQL n'est pas installé ou pas dans le PATH.${RESET}"
  exit 1
fi
echo -e "${GREEN}✅ PostgreSQL détecté${RESET}"

# ── Backend : dépendances ──────────────────────────────────
echo ""
echo -e "${BOLD}📦 Installation des dépendances backend...${RESET}"
cd backend
npm install --silent
echo -e "${GREEN}✅ Backend : dépendances installées${RESET}"

# ── Backend : .env ─────────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "${GOLD}⚠️  Fichier backend/.env créé depuis .env.example${RESET}"
  echo -e "${GOLD}   → Éditez backend/.env avec votre mot de passe PostgreSQL${RESET}"
fi

# ── Créer la base de données ───────────────────────────────
echo ""
echo -e "${BOLD}🗄️  Création de la base de données 2cheries_db...${RESET}"
psql -U postgres -c "CREATE DATABASE \"2cheries_db\";" 2>/dev/null && \
  echo -e "${GREEN}✅ Base de données créée${RESET}" || \
  echo -e "${GOLD}ℹ️  Base de données déjà existante${RESET}"

# ── Migration + Seed ───────────────────────────────────────
echo ""
echo -e "${BOLD}🔄 Migration des tables...${RESET}"
node config/migrate.js && echo -e "${GREEN}✅ Tables créées${RESET}"

echo ""
echo -e "${BOLD}🌱 Insertion des données initiales...${RESET}"
node config/seed.js && echo -e "${GREEN}✅ Données insérées${RESET}"

# ── Frontend : dépendances ─────────────────────────────────
echo ""
echo -e "${BOLD}📦 Installation des dépendances frontend...${RESET}"
cd ../frontend
npm install --silent
echo -e "${GREEN}✅ Frontend : dépendances installées${RESET}"

# ── Résumé ─────────────────────────────────────────────────
echo ""
echo -e "${GOLD}${BOLD}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "${GOLD}${BOLD}║  ✅ Installation terminée !                      ║${RESET}"
echo -e "${GOLD}${BOLD}╠══════════════════════════════════════════════════╣${RESET}"
echo -e "${GOLD}${BOLD}║                                                  ║${RESET}"
echo -e "${GOLD}${BOLD}║  Démarrer le backend :                           ║${RESET}"
echo -e "${GOLD}${BOLD}║    cd backend && npm run dev                     ║${RESET}"
echo -e "${GOLD}${BOLD}║                                                  ║${RESET}"
echo -e "${GOLD}${BOLD}║  Démarrer le frontend (autre terminal) :         ║${RESET}"
echo -e "${GOLD}${BOLD}║    cd frontend && npm start                      ║${RESET}"
echo -e "${GOLD}${BOLD}║                                                  ║${RESET}"
echo -e "${GOLD}${BOLD}║  Site :      http://localhost:3000               ║${RESET}"
echo -e "${GOLD}${BOLD}║  API :       http://localhost:5000               ║${RESET}"
echo -e "${GOLD}${BOLD}║  Admin :     http://localhost:3000/admin/login   ║${RESET}"
echo -e "${GOLD}${BOLD}║                                                  ║${RESET}"
echo -e "${GOLD}${BOLD}║  Identifiants admin :                            ║${RESET}"
echo -e "${GOLD}${BOLD}║    admin2cheries / 2cheries2026!                 ║${RESET}"
echo -e "${GOLD}${BOLD}║                                                  ║${RESET}"
echo -e "${GOLD}${BOLD}╚══════════════════════════════════════════════════╝${RESET}"
echo ""
