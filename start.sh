#!/bin/bash

# =============================================================================
# EqII Building Digital Twin - Startup Script
# =============================================================================
# Запускает Backend (FastAPI) и Frontend (React + Vite) одновременно
#
# Использование:
#   ./start.sh          - Запустить всё
#   ./start.sh backend  - Только backend
#   ./start.sh frontend - Только frontend
#   ./start.sh stop     - Остановить все процессы
# =============================================================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Директории
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/front"

# Порты
BACKEND_PORT=8005
FRONTEND_PORT=5173

# PID файлы для отслеживания процессов
PID_DIR="$SCRIPT_DIR/.pids"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

# -----------------------------------------------------------------------------
# Функции
# -----------------------------------------------------------------------------

print_banner() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║     EqII - Building Digital Twin Platform                     ║"
    echo "║     Tech Award 2025                                           ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка зависимостей
check_dependencies() {
    log_info "Проверка зависимостей..."

    # Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python3 не найден. Установите Python 3.10+"
        exit 1
    fi

    # Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js не найден. Установите Node.js 18+"
        exit 1
    fi

    # npm
    if ! command -v npm &> /dev/null; then
        log_error "npm не найден. Установите npm"
        exit 1
    fi

    log_info "✓ Все зависимости найдены"
}

# Создание директории для PID файлов
setup_pid_dir() {
    mkdir -p "$PID_DIR"
}

# Проверка, занят ли порт
is_port_in_use() {
    local port=$1
    if command -v lsof &> /dev/null; then
        lsof -i :$port &> /dev/null
    elif command -v ss &> /dev/null; then
        ss -tuln | grep -q ":$port "
    else
        # Fallback: пробуем подключиться
        (echo >/dev/tcp/localhost/$port) &>/dev/null
    fi
}

# Остановка процесса по PID файлу
stop_process() {
    local pid_file=$1
    local name=$2

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            log_info "Останавливаю $name (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            sleep 1
            # Force kill если не остановился
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
            log_info "✓ $name остановлен"
        fi
        rm -f "$pid_file"
    fi
}

# Остановка всех процессов
stop_all() {
    log_info "Останавливаю все процессы..."

    stop_process "$BACKEND_PID_FILE" "Backend"
    stop_process "$FRONTEND_PID_FILE" "Frontend"

    # Дополнительная очистка по портам
    if is_port_in_use $BACKEND_PORT; then
        log_warn "Порт $BACKEND_PORT всё ещё занят, принудительное освобождение..."
        fuser -k $BACKEND_PORT/tcp 2>/dev/null || true
    fi

    if is_port_in_use $FRONTEND_PORT; then
        log_warn "Порт $FRONTEND_PORT всё ещё занят, принудительное освобождение..."
        fuser -k $FRONTEND_PORT/tcp 2>/dev/null || true
    fi

    log_info "✓ Все процессы остановлены"
}

# Установка зависимостей Backend
setup_backend() {
    log_info "Настройка Backend..."

    cd "$BACKEND_DIR"

    # Создаём виртуальное окружение если его нет
    if [ ! -d "venv" ]; then
        log_info "Создаю виртуальное окружение Python..."
        python3 -m venv venv
    fi

    # Активируем venv и устанавливаем зависимости
    source venv/bin/activate

    log_info "Устанавливаю Python зависимости..."
    pip install -q -r requirements.txt

    log_info "✓ Backend готов"
}

# Установка зависимостей Frontend
setup_frontend() {
    log_info "Настройка Frontend..."

    cd "$FRONTEND_DIR"

    # Устанавливаем зависимости если node_modules нет или package.json изменился
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        log_info "Устанавливаю npm зависимости..."
        npm install --silent
    fi

    log_info "✓ Frontend готов"
}

# Запуск Backend
start_backend() {
    log_info "Запускаю Backend на порту $BACKEND_PORT..."

    cd "$BACKEND_DIR"

    # Проверяем, не занят ли порт
    if is_port_in_use $BACKEND_PORT; then
        log_warn "Порт $BACKEND_PORT уже занят. Останавливаю..."
        fuser -k $BACKEND_PORT/tcp 2>/dev/null || true
        sleep 1
    fi

    # Активируем venv
    source venv/bin/activate

    # Запускаем uvicorn в фоне
    nohup uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload \
        > "$SCRIPT_DIR/logs/backend.log" 2>&1 &

    local pid=$!
    echo $pid > "$BACKEND_PID_FILE"

    # Ждём запуска
    sleep 2

    if kill -0 $pid 2>/dev/null; then
        log_info "✓ Backend запущен (PID: $pid)"
        log_info "  API: http://localhost:$BACKEND_PORT"
        log_info "  Docs: http://localhost:$BACKEND_PORT/docs"
    else
        log_error "Backend не удалось запустить. Проверьте logs/backend.log"
        exit 1
    fi
}

# Запуск Frontend
start_frontend() {
    log_info "Запускаю Frontend на порту $FRONTEND_PORT..."

    cd "$FRONTEND_DIR"

    # Проверяем, не занят ли порт
    if is_port_in_use $FRONTEND_PORT; then
        log_warn "Порт $FRONTEND_PORT уже занят. Останавливаю..."
        fuser -k $FRONTEND_PORT/tcp 2>/dev/null || true
        sleep 1
    fi

    # Запускаем vite в фоне
    nohup npm run dev -- --host 0.0.0.0 \
        > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &

    local pid=$!
    echo $pid > "$FRONTEND_PID_FILE"

    # Ждём запуска
    sleep 3

    if kill -0 $pid 2>/dev/null; then
        log_info "✓ Frontend запущен (PID: $pid)"
        log_info "  App: http://localhost:$FRONTEND_PORT"
    else
        log_error "Frontend не удалось запустить. Проверьте logs/frontend.log"
        exit 1
    fi
}

# Показать статус
show_status() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  EqII Digital Twin запущен!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${BLUE}Frontend:${NC}  http://localhost:$FRONTEND_PORT"
    echo -e "  ${BLUE}Backend:${NC}   http://localhost:$BACKEND_PORT"
    echo -e "  ${BLUE}API Docs:${NC}  http://localhost:$BACKEND_PORT/docs"
    echo ""
    echo -e "  ${YELLOW}Логи:${NC}"
    echo -e "    Backend:  $SCRIPT_DIR/logs/backend.log"
    echo -e "    Frontend: $SCRIPT_DIR/logs/frontend.log"
    echo ""
    echo -e "  ${YELLOW}Для остановки:${NC} ./start.sh stop"
    echo ""
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

print_banner

# Создаём директорию для логов
mkdir -p "$SCRIPT_DIR/logs"
setup_pid_dir

case "${1:-all}" in
    stop)
        stop_all
        ;;
    backend)
        check_dependencies
        setup_backend
        start_backend
        echo ""
        echo -e "  ${BLUE}Backend:${NC} http://localhost:$BACKEND_PORT"
        echo -e "  ${BLUE}API Docs:${NC} http://localhost:$BACKEND_PORT/docs"
        echo ""
        ;;
    frontend)
        check_dependencies
        setup_frontend
        start_frontend
        echo ""
        echo -e "  ${BLUE}Frontend:${NC} http://localhost:$FRONTEND_PORT"
        echo ""
        ;;
    all|"")
        check_dependencies
        setup_backend
        setup_frontend
        start_backend
        start_frontend
        show_status
        ;;
    *)
        echo "Использование: $0 {all|backend|frontend|stop}"
        echo ""
        echo "  all      - Запустить Backend и Frontend (по умолчанию)"
        echo "  backend  - Запустить только Backend"
        echo "  frontend - Запустить только Frontend"
        echo "  stop     - Остановить все процессы"
        exit 1
        ;;
esac
