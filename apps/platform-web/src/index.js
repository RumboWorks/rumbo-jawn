import 'dotenv/config';
import express from 'express';
import Twig from 'twig';
import { fileURLToPath } from 'url';
import path from 'path';
import routes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 4000;

app.engine('twig', Twig.__express);
app.set('view engine', 'twig');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', routes);

app.listen(PORT, () => {
  console.log(`rumbo-web listening on port ${PORT}`);
});
