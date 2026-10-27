# Источники, лицензии и проверенные форматы

Проверка документации: 27 октября 2026 года. Приложение не копирует чужие учебные курсы. Русские материалы в curriculum.py созданы для этого приложения; шахматные последовательности и позиции — фактические данные.

| Компонент | Лицензия / источник | Использование |
| --- | --- | --- |
| python-chess 1.999 / chess 1.11.2 | GPL-3.0-or-later, https://github.com/niklasf/python-chess | Правила, SAN, FEN, PGN, WDL и UCI |
| Stockfish 17.1 | GPLv3, https://github.com/official-stockfish/Stockfish/tree/sf_17.1 | Отдельный локальный UCI-процесс |
| lichess-org/chess-openings | CC0, https://github.com/lichess-org/chess-openings | ECO, названия и последовательности |
| FastAPI | MIT, https://github.com/fastapi/fastapi | Локальный сервер |
| Uvicorn | BSD-3-Clause, https://github.com/encode/uvicorn | ASGI |
| httpx | BSD-3-Clause, https://github.com/encode/httpx | HTTPS с проверкой TLS |
| pytest | MIT, https://github.com/pytest-dev/pytest | Тесты |
| Playwright (необязателен) | Apache-2.0, https://github.com/microsoft/playwright-python | Браузерные проверки |

Stockfish загружается с официального GitHub Release по HTTPS; архив проверяется по закреплённому SHA-256 в setup_local.py. Архивы и установленные бинарники не добавляются в Git. Официальный архив содержит исходники, Copying.txt и документацию, которые сохраняются при установке. Соответствующие исходники также доступны по точному тегу `sf_17.1`: https://github.com/official-stockfish/Stockfish/tree/sf_17.1. При распространении бинарников сохраняйте требования GPL о лицензии и соответствующих исходниках; не распространяйте один отдельно вырезанный exe без этих материалов.

База дебютов закреплена на коммите `f06a50d5c7c140e50b068049fa31d289e2c3d347`. Её README и COPYING.txt проверены непосредственно у издателя; скачанная лицензия хранится рядом с TSV. Файлы a.tsv … e.tsv содержат поля `eco`, `name`, `pgn`. Сборник находится в public domain / CC0; русские переводы всех 3 865 имён не заявляются.

Актуальная спецификация Lichess проверена по официальному репозиторию:

- https://github.com/lichess-org/api/blob/master/doc/specs/lichess-api.yaml
- https://github.com/lichess-org/api/blob/master/doc/specs/tags/openingexplorer/masters.yaml
- https://github.com/lichess-org/api/blob/master/doc/specs/tags/openingexplorer/lichess.yaml

В ней текущий хост Explorer — `explorer.lichess.org`, хотя в старых примерах встречается `explorer.lichess.ovh`. Для рейтингов допустима группа `0`, а не `400`. Общие рекомендации API: один запрос за раз; после HTTP 429 подождать не меньше минуты. Эти правила реализованы. Живые запросы Explorer в этой машине возвращают HTTP 401 на обоих хостах; причина не подтверждена. Тесты используют явные контрактные фикстуры, их нельзя считать успешным живым запросом.

Публичный Chess.com API: https://www.chess.com/news/view/published-data-api. Выбран только доступ к архивам завершённых стандартных партий. Живой доступ к archives и месячному JSON проверен успешно. Текущая страница условий отдельно не подтверждена, поэтому полная проверка текущих условий Chess.com остаётся открытой. Нет скачивания/перепубликации массовой базы; партии сохраняются локально для личного разбора. Перед публичным распространением интеграции перепроверьте действующие условия.

Базы https://database.lichess.org/ не загружаются. Внешние наборы тактических задач не включены: небольшой встроенный набор создан из учебных позиций и проверяется установленным Stockfish. Никаких вымышленных рейтингов задач, процентов побед или сертификатов «2000+» в приложении нет.

## Версия для GitHub Pages

В web/vendor поставляются проверенные по npm SHA-512 Stockfish.js 17.1.0 Lite single-thread и chess.js 1.4.0. Лицензии и адреса соответствующих исходников точных коммитов находятся в [web/vendor/SOURCE.md](web/vendor/SOURCE.md); контрольные суммы — в provenance.json. chess.js имеет BSD-2-Clause, порт Stockfish — GPL-3.0-or-later. Однопоточная сборка не требует SharedArrayBuffer или заголовков COOP/COEP, которых GitHub Pages не предоставляет. Браузерная версия не использует Python-зависимости на стороне пользователя.
