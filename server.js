// const express = require('express');
// const cors = require('cors');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// const app = express();
// const PORT = 5000;

// app.use(cors());
// app.use(express.json());

// // Убедимся, что папка uploads существует
// const uploadDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

// // Настройка multer
// const storage = multer.diskStorage({
//   destination: (_, __, cb) => cb(null, 'uploads/'),
//   filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
// });
// const upload = multer({ storage });

// // Хранилище файлов
// let files = [];

// // Загрузка файла (с файлом или без)
// app.post('/api/author-files', upload.single('file'), (req, res) => {
//   const { title } = req.body;

//   if (!title) {
//     return res.status(400).json({ message: 'Название обязательно' });
//   }

//   // Если файл есть — добавляем с url
//   if (req.file) {
//     const newFile = {
//       id: Date.now(),
//       title,
//       url: `http://localhost:${PORT}/uploads/${req.file.filename}`,
//     };
//     files.push(newFile);
//     return res.status(201).json(newFile);
//   }

//   // Если файла нет — добавляем с пустым url
//   const newFile = {
//     id: Date.now(),
//     title,
//     url: '',
//   };
//   files.push(newFile);
//   return res.status(201).json(newFile);
// });

// // Получение списка файлов
// app.get('/api/author-files', (_, res) => res.json(files));

// // Сохранение нового порядка файлов
// app.post('/api/author-files/reorder', (req, res) => {
//   if (!Array.isArray(req.body)) return res.status(400).json({ message: 'Ожидается массив' });
//   files = req.body;
//   res.json({ message: 'Порядок обновлён' });
// });

// // Редактирование названия
// app.patch('/api/author-files/:id', (req, res) => {
//   const id = Number(req.params.id);
//   const { title } = req.body;
//   const file = files.find(f => f.id === id);
//   if (!file) return res.status(404).json({ message: 'Файл не найден' });
//   file.title = title;
//   res.json(file);
// });

// // Отдача файлов
// app.use('/uploads', express.static('uploads'));

// app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

// const express = require('express');
// const cors = require('cors');
// const multer = require('multer');
// const path = require('path');
// const { Pool } = require('pg');

// const app = express();
// const PORT = 5000;

// app.use(cors());
// app.use(express.json());

// // Подключение к Postgres
// const pool = new Pool({
//   user: 'postgres',       // поменяй на свои данные
//   host: 'localhost',
//   database: 'newsdb',
//   password: 'yourpassword',
//   port: 5432,
// });

// // Multer для загрузки картинок
// const storage = multer.diskStorage({
//   destination: (_, __, cb) => cb(null, 'uploads/'),
//   filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
// });
// const upload = multer({ storage });

// // Создаем таблицу (если нет)
// pool.query(`
//   CREATE TABLE IF NOT EXISTS news (
//     id SERIAL PRIMARY KEY,
//     title JSONB NOT NULL,
//     description JSONB NOT NULL,
//     date TIMESTAMP NOT NULL,
//     image TEXT
//   )
// `).catch(console.error);

// // Получить все новости
// app.get('/api/news', async (req, res) => {
//   try {
//     const { rows } = await pool.query('SELECT * FROM news ORDER BY date DESC');
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Получить новость по ID
// app.get('/api/news/:id', async (req, res) => {
//   const id = req.params.id;
//   try {
//     const { rows } = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
//     if (rows.length === 0) return res.status(404).json({ message: 'News not found' });
//     res.json(rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Добавить новость
// app.post('/api/news', upload.single('image'), async (req, res) => {
//   try {
//     const { title, description, date } = req.body;
//     const image = req.file ? `http://localhost:${PORT}/uploads/${req.file.filename}` : null;

//     const result = await pool.query(
//       'INSERT INTO news (title, description, date, image) VALUES ($1, $2, $3, $4) RETURNING *',
//       [JSON.parse(title), JSON.parse(description), date, image]
//     );

//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Обновить новость
// app.put('/api/news/:id', upload.single('image'), async (req, res) => {
//   const id = req.params.id;
//   try {
//     const { title, description, date } = req.body;

//     let image;
//     if (req.file) {
//       image = `http://localhost:${PORT}/uploads/${req.file.filename}`;
//     } else {
//       const oldNews = await pool.query('SELECT image FROM news WHERE id = $1', [id]);
//       image = oldNews.rows[0]?.image || null;
//     }

//     const result = await pool.query(
//       'UPDATE news SET title=$1, description=$2, date=$3, image=$4 WHERE id=$5 RETURNING *',
//       [JSON.parse(title), JSON.parse(description), date, image, id]
//     );

//     if (result.rows.length === 0) return res.status(404).json({ message: 'News not found' });
//     res.json(result.rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Удалить новость
// app.delete('/api/news/:id', async (req, res) => {
//   const id = req.params.id;
//   try {
//     const result = await pool.query('DELETE FROM news WHERE id = $1 RETURNING *', [id]);
//     if (result.rows.length === 0) return res.status(404).json({ message: 'News not found' });
//     res.json({ message: 'News deleted' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Отдача картинок
// app.use('/uploads', express.static('uploads'));

// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// require('dotenv').config();  // Добавляем это в начало файла

// const express = require('express');
// const cors = require('cors');
// const multer = require('multer');
// const path = require('path');
// const { Pool } = require('pg');

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// // Подключение к Postgres через переменные окружения
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// // Multer для загрузки картинок
// const storage = multer.diskStorage({
//   destination: (_, __, cb) => cb(null, 'uploads/'),
//   filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
// });
// const upload = multer({ storage });

// // Создаем таблицу (если нет)
// pool.query(`
//   CREATE TABLE IF NOT EXISTS news (
//     id SERIAL PRIMARY KEY,
//     title JSONB NOT NULL,
//     description JSONB NOT NULL,
//     date TIMESTAMP NOT NULL,
//     image TEXT
//   )
// `).catch(console.error);

// // Получить все новости
// app.get('/api/news', async (req, res) => {
//   try {
//     const { rows } = await pool.query('SELECT * FROM news ORDER BY date DESC');
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Получить новость по ID
// app.get('/api/news/:id', async (req, res) => {
//   const id = req.params.id;
//   try {
//     const { rows } = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
//     if (rows.length === 0) return res.status(404).json({ message: 'News not found' });
//     res.json(rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Добавить новость
// app.post('/api/news', upload.single('image'), async (req, res) => {
//   try {
//     const { title, description, date } = req.body;
//     const image = req.file ? `http://localhost:${PORT}/uploads/${req.file.filename}` : null;

//     const result = await pool.query(
//       'INSERT INTO news (title, description, date, image) VALUES ($1, $2, $3, $4) RETURNING *',
//       [JSON.parse(title), JSON.parse(description), date, image]
//     );

//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Обновить новость
// app.put('/api/news/:id', upload.single('image'), async (req, res) => {
//   const id = req.params.id;
//   try {
//     const { title, description, date } = req.body;

//     let image;
//     if (req.file) {
//       image = `http://localhost:${PORT}/uploads/${req.file.filename}`;
//     } else {
//       const oldNews = await pool.query('SELECT image FROM news WHERE id = $1', [id]);
//       image = oldNews.rows[0]?.image || null;
//     }

//     const result = await pool.query(
//       'UPDATE news SET title=$1, description=$2, date=$3, image=$4 WHERE id=$5 RETURNING *',
//       [JSON.parse(title), JSON.parse(description), date, image, id]
//     );

//     if (result.rows.length === 0) return res.status(404).json({ message: 'News not found' });
//     res.json(result.rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Удалить новость
// app.delete('/api/news/:id', async (req, res) => {
//   const id = req.params.id;
//   try {
//     const result = await pool.query('DELETE FROM news WHERE id = $1 RETURNING *', [id]);
//     if (result.rows.length === 0) return res.status(404).json({ message: 'News not found' });
//     res.json({ message: 'News deleted' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Отдача картинок
// app.use('/uploads', express.static('uploads'));

// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));




// require('dotenv').config();

// const express = require('express');
// const cors = require('cors');
// const multer = require('multer');
// const path = require('path');
// const { Pool } = require('pg');

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// // Подключение к Postgres через переменные окружения
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// // Multer для загрузки картинок
// const storage = multer.diskStorage({
//   destination: (_, __, cb) => cb(null, 'uploads/'),
//   filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
// });
// const upload = multer({ storage });

// // ===== Таблицы =====

// // Таблица новостей
// pool.query(`
//   CREATE TABLE IF NOT EXISTS news (
//     id SERIAL PRIMARY KEY,
//     title JSONB NOT NULL,
//     description JSONB NOT NULL,
//     date TIMESTAMP NOT NULL,
//     image TEXT
//   )
// `).catch(console.error);

// // Таблица слайдов издательства
// pool.query(`
//   CREATE TABLE IF NOT EXISTS publishing_slider (
//     id SERIAL PRIMARY KEY,
//     title TEXT NOT NULL,
//     description TEXT NOT NULL,
//     date TIMESTAMP NOT NULL,
//     image TEXT
//   )
// `).catch(console.error);

// // ===== Новости =====

// // Получить все новости
// app.get('/api/news', async (req, res) => {
//   try {
//     const { rows } = await pool.query('SELECT * FROM news ORDER BY date DESC');
//     res.json(rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // Получить новость по ID
// app.get('/api/news/:id', async (req, res) => {
//   const id = req.params.id;
//   try {
//     const { rows } = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
//     if (rows.length === 0) return res.status(404).json({ message: 'News not found' });
//     res.json(rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // Добавить новость
// app.post('/api/news', upload.single('image'), async (req, res) => {
//   try {
//     const { title, description, date } = req.body;
//     const image = req.file ? `http://localhost:${PORT}/uploads/${req.file.filename}` : null;

//     const result = await pool.query(
//       'INSERT INTO news (title, description, date, image) VALUES ($1, $2, $3, $4) RETURNING *',
//       [JSON.parse(title), JSON.parse(description), date, image]
//     );

//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // Обновить новость
// app.put('/api/news/:id', upload.single('image'), async (req, res) => {
//   const id = req.params.id;
//   try {
//     const { title, description, date } = req.body;

//     let image;
//     if (req.file) {
//       image = `http://localhost:${PORT}/uploads/${req.file.filename}`;
//     } else {
//       const oldNews = await pool.query('SELECT image FROM news WHERE id = $1', [id]);
//       image = oldNews.rows[0]?.image || null;
//     }

//     const result = await pool.query(
//       'UPDATE news SET title=$1, description=$2, date=$3, image=$4 WHERE id=$5 RETURNING *',
//       [JSON.parse(title), JSON.parse(description), date, image, id]
//     );

//     if (result.rows.length === 0) return res.status(404).json({ message: 'News not found' });
//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // Удалить новость
// app.delete('/api/news/:id', async (req, res) => {
//   const id = req.params.id;
//   try {
//     const result = await pool.query('DELETE FROM news WHERE id = $1 RETURNING *', [id]);
//     if (result.rows.length === 0) return res.status(404).json({ message: 'News not found' });
//     res.json({ message: 'News deleted' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // ===== Publishing Slider =====

// // Получить все слайды
// app.get('/api/publishingslider', async (req, res) => {
//   try {
//     const { rows } = await pool.query('SELECT * FROM publishing_slider ORDER BY date DESC');
//     res.json(rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // Добавить слайд
// app.post('/api/publishingslider', upload.single('image'), async (req, res) => {
//   try {
//     const { title, description, date } = req.body;
//     const image = req.file ? `http://localhost:${PORT}/uploads/${req.file.filename}` : null;

//     const result = await pool.query(
//       'INSERT INTO publishing_slider (title, description, date, image) VALUES ($1, $2, $3, $4) RETURNING *',
//       [title, description, date, image]
//     );

//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // Удалить слайд
// app.delete('/api/publishingslider/:id', async (req, res) => {
//   const id = req.params.id;
//   try {
//     const result = await pool.query('DELETE FROM publishing_slider WHERE id = $1 RETURNING *', [id]);
//     if (result.rows.length === 0) return res.status(404).json({ message: 'Slide not found' });
//     res.json({ message: 'Slide deleted' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // ===== Статика =====
// app.use('/uploads', express.static('uploads'));

// // ===== Запуск =====
// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));



// require('dotenv').config();

// const express = require('express');
// const cors = require('cors');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const { Pool } = require('pg');

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// // Подключение к Postgres
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// // ===== Multer =====
// // Для изображений
// const imageStorage = multer.diskStorage({
//   destination: (_, __, cb) => cb(null, 'uploads/'),
//   filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
// });
// const uploadImage = multer({ storage: imageStorage });

// // Для файлов авторов (PDF/DOC/DOCX)
// const fileStorage = multer.diskStorage({
//   destination: (_, __, cb) => cb(null, 'uploads/'),
//   filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
// });
// const fileFilter = (_, file, cb) => {
//   const allowedTypes = /pdf|doc|docx/;
//   const ext = path.extname(file.originalname).toLowerCase().substring(1);
//   if (allowedTypes.test(ext)) cb(null, true);
//   else cb(new Error('Only PDF/DOC/DOCX files are allowed'));
// };
// const uploadAuthorFile = multer({ storage: fileStorage, fileFilter });

// // ===== Создание таблиц =====
// (async () => {
//   try {
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS news (
//         id SERIAL PRIMARY KEY,
//         title JSONB NOT NULL,
//         description JSONB NOT NULL,
//         date TIMESTAMP NOT NULL,
//         image TEXT
//       )
//     `);

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS publishing_slider (
//         id SERIAL PRIMARY KEY,
//         title TEXT NOT NULL,
//         description TEXT NOT NULL,
//         date TIMESTAMP NOT NULL,
//         image TEXT
//       )
//     `);

//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS author_files (
//         id SERIAL PRIMARY KEY,
//         title TEXT NOT NULL,
//         filepath TEXT
//       )
//     `);

//     console.log('Tables ensured');
//   } catch (err) {
//     console.error(err);
//   }
// })();

// // ===== Новости =====
// app.get('/api/news', async (req, res) => {
//   try {
//     const { rows } = await pool.query('SELECT * FROM news ORDER BY date DESC');
//     res.json(rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.get('/api/news/:id', async (req, res) => {
//   try {
//     const { rows } = await pool.query('SELECT * FROM news WHERE id=$1', [req.params.id]);
//     if (!rows.length) return res.status(404).json({ message: 'News not found' });
//     res.json(rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post('/api/news', uploadImage.single('image'), async (req, res) => {
//   try {
//     const { title, description, date } = req.body;
//     const image = req.file ? `http://localhost:${PORT}/uploads/${req.file.filename}` : null;
//     const result = await pool.query(
//       'INSERT INTO news (title, description, date, image) VALUES ($1,$2,$3,$4) RETURNING *',
//       [JSON.parse(title), JSON.parse(description), date, image]
//     );
//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.put('/api/news/:id', uploadImage.single('image'), async (req, res) => {
//   try {
//     const { title, description, date } = req.body;
//     const id = req.params.id;

//     let image;
//     if (req.file) {
//       image = `http://localhost:${PORT}/uploads/${req.file.filename}`;
//     } else {
//       const oldNews = await pool.query('SELECT image FROM news WHERE id=$1', [id]);
//       image = oldNews.rows[0]?.image || null;
//     }

//     const result = await pool.query(
//       'UPDATE news SET title=$1, description=$2, date=$3, image=$4 WHERE id=$5 RETURNING *',
//       [JSON.parse(title), JSON.parse(description), date, image, id]
//     );
//     if (!result.rows.length) return res.status(404).json({ message: 'News not found' });
//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.delete('/api/news/:id', async (req, res) => {
//   try {
//     const result = await pool.query('DELETE FROM news WHERE id=$1 RETURNING *', [req.params.id]);
//     if (!result.rows.length) return res.status(404).json({ message: 'News not found' });
//     res.json({ message: 'News deleted' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // ===== Publishing Slider =====
// app.get('/api/publishingslider', async (req, res) => {
//   try {
//     const { rows } = await pool.query('SELECT * FROM publishing_slider ORDER BY date DESC');
//     res.json(rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post('/api/publishingslider', uploadImage.single('image'), async (req, res) => {
//   try {
//     const { title, description, date } = req.body;
//     const image = req.file ? `http://localhost:${PORT}/uploads/${req.file.filename}` : null;
//     const result = await pool.query(
//       'INSERT INTO publishing_slider (title, description, date, image) VALUES ($1,$2,$3,$4) RETURNING *',
//       [title, description, date, image]
//     );
//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.delete('/api/publishingslider/:id', async (req, res) => {
//   try {
//     const result = await pool.query('DELETE FROM publishing_slider WHERE id=$1 RETURNING *', [req.params.id]);
//     if (!result.rows.length) return res.status(404).json({ message: 'Slide not found' });
//     res.json({ message: 'Slide deleted' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // ===== Для авторов (файлы) =====
// app.get('/api/author-files', async (req, res) => {
//   try {
//     const { rows } = await pool.query('SELECT * FROM author_files ORDER BY id DESC');
//     const files = rows.map(r => ({
//       id: r.id,
//       title: r.title,
//       url: r.filepath || null
//     }));
//     res.json(files);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post('/api/author-files', uploadAuthorFile.single('file'), async (req, res) => {
//   try {
//     const { title } = req.body;
//     const filepath = req.file ? `http://localhost:${PORT}/uploads/${req.file.filename}` : null;

//     const result = await pool.query(
//       'INSERT INTO author_files (title, filepath) VALUES ($1,$2) RETURNING *',
//       [title, filepath]
//     );
//     res.status(201).json({
//       id: result.rows[0].id,
//       title: result.rows[0].title,
//       url: result.rows[0].filepath
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.patch('/api/author-files/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title } = req.body;

//     const result = await pool.query(
//       'UPDATE author_files SET title=$1 WHERE id=$2 RETURNING *',
//       [title, id]
//     );
//     if (!result.rows.length) return res.status(404).json({ message: 'File not found' });

//     res.json({
//       id: result.rows[0].id,
//       title: result.rows[0].title,
//       url: result.rows[0].filepath
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.delete('/api/author-files/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const result = await pool.query('SELECT filepath FROM author_files WHERE id=$1', [id]);
//     if (!result.rows.length) return res.status(404).json({ message: 'File not found' });

//     const filepath = result.rows[0].filepath;
//     if (filepath) {
//       const localPath = path.join(__dirname, filepath.replace(`http://localhost:${PORT}/`, ''));
//       fs.unlink(localPath, err => {
//         if (err) console.error('Error deleting file from disk:', err);
//       });
//     }

//     await pool.query('DELETE FROM author_files WHERE id=$1', [id]);
//     res.json({ message: 'File deleted' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // ===== Статика =====
// app.use('/uploads', express.static('uploads'));

// // ===== Запуск =====
// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Подключение к Postgres
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
   ssl: {
    rejectUnauthorized: false,
  },
});

// ===== Multer =====
// Для изображений
const imageStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, 'uploads/'),
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const uploadImage = multer({ storage: imageStorage });

// Для файлов авторов (PDF/DOC/DOCX)
const fileStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, 'uploads/'),
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const fileFilter = (_, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  if (allowedTypes.test(ext)) cb(null, true);
  else cb(new Error('Only PDF/DOC/DOCX files are allowed'));
};
const uploadAuthorFile = multer({ storage: fileStorage, fileFilter });

// ===== Создание таблиц =====
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title JSONB NOT NULL,
        description JSONB NOT NULL,
        date TIMESTAMP NOT NULL,
        image TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS publishing_slider (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        date TIMESTAMP NOT NULL,
        image TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS author_files (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        filepath TEXT,
        "order" INTEGER DEFAULT 0
      )
    `);
    await pool.query(`
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name='author_files' AND column_name='order'
    ) THEN
      ALTER TABLE author_files ADD COLUMN "order" INTEGER DEFAULT 0;
    END IF;
  END
  $$;
`);

    console.log('Tables ensured');
  } catch (err) {
    console.error(err);
  }
})();

// ===== Новости =====
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});
app.get('/api/news', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM news ORDER BY date DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/news/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM news WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'News not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/news', uploadImage.single('image'), async (req, res) => {
  try {
    const { title, description, date } = req.body;
    const image = req.file ? `http://localhost:${PORT}/uploads/${req.file.filename}` : null;
    const result = await pool.query(
      'INSERT INTO news (title, description, date, image) VALUES ($1,$2,$3,$4) RETURNING *',
      [JSON.parse(title), JSON.parse(description), date, image]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/news/:id', uploadImage.single('image'), async (req, res) => {
  try {
    const { title, description, date } = req.body;
    const id = req.params.id;

    let image;
    if (req.file) {
      image = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    } else {
      const oldNews = await pool.query('SELECT image FROM news WHERE id=$1', [id]);
      image = oldNews.rows[0]?.image || null;
    }

    const result = await pool.query(
      'UPDATE news SET title=$1, description=$2, date=$3, image=$4 WHERE id=$5 RETURNING *',
      [JSON.parse(title), JSON.parse(description), date, image, id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'News not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/news/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM news WHERE id=$1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'News not found' });
    res.json({ message: 'News deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ===== Publishing Slider =====
app.get('/api/publishingslider', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM publishing_slider ORDER BY date DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/publishingslider', uploadImage.single('image'), async (req, res) => {
  try {
    const { title, description, date } = req.body;
    const image = req.file ? `http://localhost:${PORT}/uploads/${req.file.filename}` : null;
    const result = await pool.query(
      'INSERT INTO publishing_slider (title, description, date, image) VALUES ($1,$2,$3,$4) RETURNING *',
      [title, description, date, image]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/publishingslider/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM publishing_slider WHERE id=$1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Slide not found' });
    res.json({ message: 'Slide deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ===== Для авторов (файлы) =====
app.get('/api/author-files', async (req, res) => {
  try {
    // Сортируем по order ASC (чтобы порядок сохранялся)
    const { rows } = await pool.query('SELECT * FROM author_files ORDER BY "order" ASC, id DESC');
    const files = rows.map(r => ({
      id: r.id,
      title: r.title,
      url: r.filepath || null
    }));
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/author-files', uploadAuthorFile.single('file'), async (req, res) => {
  try {
    const { title } = req.body;
    const filepath = req.file ? `http://localhost:${PORT}/uploads/${req.file.filename}` : null;

    // При добавлении файла ставим order = (макс order + 1) для вставки в конец
    const orderRes = await pool.query('SELECT COALESCE(MAX("order"), 0) as max_order FROM author_files');
    const newOrder = orderRes.rows[0].max_order + 1;

    const result = await pool.query(
      'INSERT INTO author_files (title, filepath, "order") VALUES ($1,$2,$3) RETURNING *',
      [title, filepath, newOrder]
    );
    res.status(201).json({
      id: result.rows[0].id,
      title: result.rows[0].title,
      url: result.rows[0].filepath
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/author-files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const result = await pool.query(
      'UPDATE author_files SET title=$1 WHERE id=$2 RETURNING *',
      [title, id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'File not found' });

    res.json({
      id: result.rows[0].id,
      title: result.rows[0].title,
      url: result.rows[0].filepath
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/author-files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT filepath FROM author_files WHERE id=$1', [id]);
    if (!result.rows.length) return res.status(404).json({ message: 'File not found' });

    const filepath = result.rows[0].filepath;
    if (filepath) {
      const localPath = path.join(__dirname, filepath.replace(`http://localhost:${PORT}/`, ''));
      fs.unlink(localPath, err => {
        if (err) console.error('Error deleting file from disk:', err);
      });
    }

    await pool.query('DELETE FROM author_files WHERE id=$1', [id]);
    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ===== Новый роут для обновления порядка файлов =====
app.patch('/api/author-files/order', async (req, res) => {
  // Ожидаем массив: [{ id: 1, order: 1 }, { id: 2, order: 2 }, ...]
  try {
    const filesOrder = req.body;

    if (!Array.isArray(filesOrder)) {
      return res.status(400).json({ message: 'Invalid payload, expected an array' });
    }

    const queries = filesOrder.map(f =>
      pool.query('UPDATE author_files SET "order" = $1 WHERE id = $2', [f.order, f.id])
    );

    await Promise.all(queries);
    res.json({ message: 'Order updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ===== Статика =====
app.use('/uploads', express.static('uploads'));

// ===== Запуск =====
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
