import VortexPage from './pages/VortexPage';

// Fora de telas com proporção próxima de 9:16 (celular), o app roda dentro
// de uma "moldura" vertical centralizada — ver `.viewport`/`.app` em index.css.
export default function App() {
  return (
    <div className="viewport">
      <VortexPage />
    </div>
  );
}
