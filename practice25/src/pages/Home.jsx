
import { useState } from 'react';

function Home() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Главная страница</h1>
      <p>Добро пожаловать в приложение</p>
      <button onClick={() => setCount(count + 1)}>
        Нажатий: {count}
      </button>
    </div>
  );
}

export default Home;