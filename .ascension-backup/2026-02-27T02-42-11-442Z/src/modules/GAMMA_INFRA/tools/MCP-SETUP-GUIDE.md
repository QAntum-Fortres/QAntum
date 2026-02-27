# 🧠 QAntum Sovereign MCP Server - Setup Guide

## Автоматична интеграция с Cline

### Стъпка 1: Отвори Cline настройки

1. В VS Code натисни `Ctrl+Shift+P`
2. Напиши "Cline: Open MCP Settings"
3. Натисни Enter

### Стъпка 2: Добави QAntum сървъра

Добави това в `mcpServers` обекта:

```json
{
  "mcpServers": {
    "qantum-sovereign-agent": {
      "command": "npx",
      "args": ["ts-node", "C:/MisteMind/tools/mcp-server.ts"],
      "env": {
        "NODE_ENV": "development"
      },
      "disabled": false,
      "alwaysAllow": [
        "magnet_scan",
        "module_search",
        "heal_system",
        "nerve_center_status",
        "empire_stats",
        "ghost_stealth_check",
        "security_scan",
        "analyze_code"
      ]
    }
  }
}
```

### Стъпка 3: Рестартирай VS Code

Cline ще разпознае новия MCP сървър.

---

## 🛠️ Налични инструменти (13 tools)

| Tool | Описание |
|------|----------|
| `magnet_scan` | 🧲 Сканира всички 127+ модула |
| `module_search` | 🔍 Търси модули по име/категория |
| `heal_system` | 🩺 Диагностика и самолечение |
| `execute_command` | ⚡ Изпълнява терминални команди |
| `read_module` | 📖 Чете файлове |
| `write_module` | ✍️ Записва файлове |
| `nerve_center_status` | 🧠 Проверява Nerve Center |
| `nerve_center_chat` | 💬 Чат с Ollama |
| `analyze_code` | 🔬 Анализира код |
| `ghost_stealth_check` | 👻 Ghost Protocol статус |
| `security_scan` | 🔐 Security сканиране |
| `empire_stats` | 📊 Статистика на империята |
| `run_script` | 🚀 Стартира скриптове |

---

## 🚀 Примери за използване в Cline

### Сканиране на империята:
```
Използвай magnet_scan за да видиш всички модули в QAntum империята.
```

### Търсене на модул:
```
Търси модули свързани със security използвайки module_search.
```

### Проверка на здравето:
```
Провери здравето на системата с heal_system.
```

### Ghost Protocol:
```
Провери статуса на Ghost Protocol с ghost_stealth_check.
```

---

## 📁 Файлове

- **MCP Server**: `C:/MisteMind/tools/mcp-server.ts`
- **Config**: `C:/MisteMind/tools/cline-mcp-config.json`
- **Vault**: `C:/MisteMind/QANTUM-VAULT.md`
- **Security Audit**: `C:/MisteMind/qantum-nerve-center/SECURITY-AUDIT.md`

---

## ⚡ Бърз старт

```bash
# Тествай MCP сървъра ръчно
cd C:\MisteMind\tools
npx ts-node mcp-server.ts
```

---

*Created by QAntum Sovereign Agent v35.0*
