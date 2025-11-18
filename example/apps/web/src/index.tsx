import { Button } from '@example/ui';
import { fetchUser } from '@example/api';

function App() {
  const user = fetchUser('123');
  return <div>{Button()}</div>;
}

export default App;
