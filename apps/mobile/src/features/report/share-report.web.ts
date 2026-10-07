/**
 * Na web, o `expo-print` imprime a página inteira do app. Aqui o relatório vai
 * para um iframe escondido e só ele é impresso — o navegador oferece
 * "Salvar como PDF".
 */
export async function shareReport(html: string): Promise<void> {
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);

  await new Promise<void>((resolve) => {
    frame.onload = () => resolve();
    frame.srcdoc = html;
  });

  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  setTimeout(() => frame.remove(), 1000);
}
