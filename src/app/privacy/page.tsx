export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Политика конфиденциальности</h1>
      <div className="glass-card p-6 space-y-3">
        <p className="text-slate-700">
          Мы обрабатываем минимальный набор данных для работы сервиса: email для входа, имя и город в профиле, данные заявок и сообщений в чате.
        </p>
        <h2 className="text-lg font-semibold">Какие данные мы храним</h2>
        <ul className="list-disc pl-5 text-slate-700 space-y-1">
          <li>Email (для авторизации)</li>
          <li>Имя и город (для отображения в сервисе)</li>
          <li>Тексты заявок, откликов и сообщений</li>
        </ul>
        <h2 className="text-lg font-semibold">Цели обработки</h2>
        <p className="text-slate-700">Предоставление функционала: регистрация/вход, размещение заявок, отклики мастеров, чат.</p>
        <h2 className="text-lg font-semibold">Передача третьим лицам</h2>
        <p className="text-slate-700">Данные не продаются и не передаются третьим лицам, кроме случаев, когда это требуется законом.</p>
        <h2 className="text-lg font-semibold">Удаление аккаунта</h2>
        <p className="text-slate-700">Для удаления аккаунта обратитесь к администратору.</p>
      </div>
    </section>
  );
}

