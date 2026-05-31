import 'dotenv/config';
import express from 'express';
import Twig from 'twig';
import { fileURLToPath } from 'url';
import path from 'path';
import { buildSessionMiddleware, configurePassport } from '@rumbo/auth';
import routes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 4000;

// View engine
app.engine('twig', Twig.__express);
app.set('view engine', 'twig');
app.set('views', path.join(__dirname, '../views'));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session + Passport
app.use(buildSessionMiddleware());
const passport = configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Expose current user to all Twig templates
app.use((req, res, next) => {
  res.locals.currentUser = req.user ?? null;
  next();
});

// Routes
app.use('/', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('pages/error', { status: 404, message: 'Page not found' });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).render('pages/error', { status: 500, message: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`rumbo-web listening on port ${PORT}`);
});
