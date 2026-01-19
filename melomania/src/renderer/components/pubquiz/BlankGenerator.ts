import { PubQuizGame, PubQuizRound } from '../../types/game';

// Генерация HTML для одного бланка раунда
export const generateRoundBlankHTML = (
  game: PubQuizGame,
  round: PubQuizRound,
  roundIndex: number,
  teamNumber: number
): string => {
  const isChoiceRound = round.type === 'choice';
  
  const styles = `
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      @page {
        size: A4;
        margin: 15mm;
      }
      body {
        font-family: 'Arial', sans-serif;
        padding: 20px;
        background: white;
        color: #1a1a1a;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 3px solid #1a1a1a;
        padding-bottom: 12px;
        margin-bottom: 20px;
      }
      .quiz-title {
        font-size: 14px;
        color: #666;
        margin-bottom: 4px;
      }
      .round-title {
        font-size: 22px;
        font-weight: bold;
      }
      .round-info {
        font-size: 12px;
        color: #666;
        margin-top: 4px;
      }
      .team-box {
        text-align: center;
        border: 3px solid #1a1a1a;
        padding: 8px 20px;
      }
      .team-label {
        font-size: 10px;
        color: #666;
        margin-bottom: 2px;
      }
      .team-number {
        font-size: 32px;
        font-weight: bold;
      }
      .questions {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .question {
        display: flex;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid #eee;
        gap: 12px;
      }
      .question-number {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #1a1a1a;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        flex-shrink: 0;
      }
      .answer-line {
        flex: 1;
        border-bottom: 2px solid #1a1a1a;
        height: 28px;
      }
      .points-badge {
        background: #f5f5f5;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        color: #666;
        flex-shrink: 0;
      }
      /* Стили для вопросов с выбором */
      .choice-options {
        display: flex;
        gap: 16px;
        flex: 1;
      }
      .choice-option {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .choice-circle {
        width: 32px;
        height: 32px;
        border: 3px solid #1a1a1a;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
      }
      .footer {
        margin-top: 30px;
        padding-top: 12px;
        border-top: 2px solid #1a1a1a;
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #666;
      }
      @media print {
        body { padding: 0; }
      }
    </style>
  `;

  const questionsHTML = round.questions.map((question, index) => {
    if (isChoiceRound) {
      return `
        <div class="question">
          <div class="question-number">${index + 1}</div>
          <div class="choice-options">
            <div class="choice-option">
              <div class="choice-circle">A</div>
            </div>
            <div class="choice-option">
              <div class="choice-circle">B</div>
            </div>
            <div class="choice-option">
              <div class="choice-circle">C</div>
            </div>
            <div class="choice-option">
              <div class="choice-circle">D</div>
            </div>
          </div>
          <div class="points-badge">${question.points} б.</div>
        </div>
      `;
    }

    return `
      <div class="question">
        <div class="question-number">${index + 1}</div>
        <div class="answer-line"></div>
        <div class="points-badge">${question.points} б.</div>
      </div>
    `;
  }).join('');

  const roundTypeLabel = {
    text: 'Текстовый раунд',
    music: 'Музыкальный раунд',
    picture: 'Раунд с картинками',
    blitz: 'Блиц-раунд',
    video: 'Видео-раунд',
    choice: 'Выбор ответа (A/B/C/D)'
  }[round.type] || 'Раунд';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Раунд ${roundIndex + 1} - ${round.name}</title>
      ${styles}
    </head>
    <body>
      <div class="header">
        <div>
          <div class="quiz-title">${game.name}</div>
          <div class="round-title">Раунд ${roundIndex + 1}: ${round.name}</div>
          <div class="round-info">${roundTypeLabel} · ${round.questions.length} вопросов · ${round.questions.reduce((s, q) => s + q.points, 0)} баллов</div>
        </div>
        <div class="team-box">
          <div class="team-label">КОМАНДА</div>
          <div class="team-number">${teamNumber}</div>
        </div>
      </div>

      <div class="questions">
        ${questionsHTML}
      </div>

      <div class="footer">
        <div>МелоМания · Паб-квиз</div>
        <div>Раунд ${roundIndex + 1} из ${game.rounds.length}</div>
      </div>
    </body>
    </html>
  `;
};

// Генерация всех бланков для одной команды (все раунды)
export const generateTeamBlanksHTML = (
  game: PubQuizGame,
  teamNumber: number
): string => {
  const styles = `
    <style>
      @media print {
        .page-break { page-break-after: always; }
        .page-break:last-child { page-break-after: avoid; }
      }
    </style>
  `;

  const roundsHTML = game.rounds.map((round, index) => {
    const roundHTML = generateRoundBlankHTML(game, round, index, teamNumber);
    // Извлекаем только body content
    const bodyContent = roundHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || '';
    return `<div class="page-break">${bodyContent}</div>`;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Бланки команды ${teamNumber} - ${game.name}</title>
      ${styles}
    </head>
    <body>
      ${roundsHTML}
    </body>
    </html>
  `;
};

// Генерация бланков для всех команд
export const generateAllBlanks = (
  game: PubQuizGame,
  teamCount: number
): string[] => {
  const blanks: string[] = [];
  
  for (let i = 1; i <= teamCount; i++) {
    blanks.push(generateTeamBlanksHTML(game, i));
  }
  
  return blanks;
};

// Печать бланков для одного раунда (все команды)
export const printRoundBlanks = (
  game: PubQuizGame,
  roundIndex: number,
  teamCount: number
) => {
  const round = game.rounds[roundIndex];
  if (!round) return;

  const styles = `
    <style>
      @media print {
        .page-break { page-break-after: always; }
        .page-break:last-child { page-break-after: avoid; }
      }
    </style>
  `;

  const blanksHTML = Array.from({ length: teamCount }, (_, i) => {
    const html = generateRoundBlankHTML(game, round, roundIndex, i + 1);
    const bodyContent = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || '';
    return `<div class="page-break">${bodyContent}</div>`;
  }).join('');

  const fullHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Раунд ${roundIndex + 1} - Все команды</title>
      ${styles}
    </head>
    <body>
      ${blanksHTML}
    </body>
    </html>
  `;

  printBlank(fullHTML);
};

// Конвертация HTML в PDF (через печать браузера)
export const printBlank = (html: string) => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

// Скачать все бланки (все раунды для всех команд)
export const downloadAllBlanks = async (
  game: PubQuizGame,
  teamCount: number
) => {
  const styles = `
    <style>
      @media print {
        .page-break { page-break-after: always; }
        .page-break:last-child { page-break-after: avoid; }
      }
    </style>
  `;

  // Генерируем бланки: каждый раунд для каждой команды
  let allBlanksHTML = '';
  
  for (let teamNum = 1; teamNum <= teamCount; teamNum++) {
    for (let roundIdx = 0; roundIdx < game.rounds.length; roundIdx++) {
      const round = game.rounds[roundIdx];
      const html = generateRoundBlankHTML(game, round, roundIdx, teamNum);
      const bodyContent = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || '';
      allBlanksHTML += `<div class="page-break">${bodyContent}</div>`;
    }
  }

  const fullHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Все бланки - ${game.name}</title>
      ${styles}
    </head>
    <body>
      ${allBlanksHTML}
    </body>
    </html>
  `;

  printBlank(fullHTML);
};

export default {
  generateRoundBlankHTML,
  generateTeamBlanksHTML,
  generateAllBlanks,
  printRoundBlanks,
  printBlank,
  downloadAllBlanks
};
