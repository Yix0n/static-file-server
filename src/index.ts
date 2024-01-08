import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { config } from 'dotenv';
import { join, extname } from 'path';
import { readdirSync, readFile, existsSync, mkdirSync, writeFile, rename } from 'fs';
import { IncomingForm, File } from 'formidable';

config();

const app = express();
const httpServer = createServer(app);
const uploadDir = join(__dirname + '/uploads');

if (!existsSync(uploadDir)) mkdirSync(uploadDir, '0777');

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(join(process.cwd(), '/src/page.html'));
});

app.get('/fetch', (req, res) => {
    res.sendFile(join(process.cwd(), '/src/fetch.html'));
});

app.get('/files', (req, res) => {
    const files = readdirSync(uploadDir);
    res.json({ files });
});

app.get('/file/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = join(uploadDir, fileName);

    readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            res.status(500).send('Błąd podczas odczytu pliku.');
        } else {
            res.sendFile(`${filePath}`);
        }
    });
});

const upload = async (req:Request, res: Response) => {
    try {
        const form = new IncomingForm();
      
        form.parse(req, (err, field, file) => {
            if (err) throw err;
            if (!file.fileInput) return res.status(401).json({ message: 'No file Selected' });
            file.fileInput.forEach((file) => {
                const newFilepath = `${uploadDir}/${file.originalFilename}`;
                rename(file.filepath, newFilepath, err => err);
            });
            return res.status(200).json({ message: ' File Uploaded ' });
        });
    }
    catch (err) {
        res.status(401).json({ message: 'Error occured', error: err });
    }
  
  }

app.post('/upload', upload);



httpServer.listen(process.env.PORT || 3000, () => {
    console.log(`Server is listening on http://localhost:${process.env.PORT || 3000}`);
});
