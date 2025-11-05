import { createApp } from '@/app';

const app = createApp();
const port: number = 3000;

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
