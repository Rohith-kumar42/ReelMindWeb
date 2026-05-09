const steps = [
  'Scraping reel',
  'Reading resource',
  'Understanding content',
  'Generating embedding',
  'Checking duplicates',
];

export function createAILoadingState() {
  let index = 0;
  let timer = null;
  const wrap = document.createElement('div');
  wrap.className = 'ai-loading';

  function render() {
    wrap.innerHTML = `
      ${steps.map((step, stepIndex) => {
        const status = stepIndex < index ? 'done' : stepIndex === index ? 'active' : 'pending';
        const icon = status === 'done' ? 'ok' : status === 'active' ? '...' : '';
        return `<div class="ai-step ${status}"><span>${icon}</span><p>${step}</p></div>`;
      }).join('')}
      <p class="muted">This typically takes 15 to 30 seconds.</p>
    `;
  }

  render();

  return {
    el: wrap,
    start() {
      clearInterval(timer);
      index = 0;
      render();
      timer = setInterval(() => {
        index = Math.min(steps.length - 1, index + 1);
        render();
      }, 3600);
    },
    finish() {
      clearInterval(timer);
      index = steps.length;
      render();
    },
    stop() {
      clearInterval(timer);
    },
  };
}
