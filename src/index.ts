import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { config } from 'dotenv';
import { join, extname } from 'path';
import { readdirSync, readFile, existsSync, mkdirSync, writeFile, rename, createReadStream } from 'fs';
import { IncomingForm, File } from 'formidable';
import consolidate from 'consolidate';

config();

const POPECODE = 2137

const app = express();
const httpServer = createServer(app);
const uploadDir = join(__dirname + '/uploads');

// handlebar engine

app.engine('hbs', consolidate.handlebars)
app.set('view engine', 'hbs')
app.set('views', join(process.cwd(), "src/hbs"))

if (!existsSync(uploadDir)) mkdirSync(uploadDir, '0777');

app.use(express.static('public'));
app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.get('/', (req, res) => {
    res.render('page')
});

app.get('/fetch', (req, res) => {
    res.render('fetch')
});

app.get('/files', (req, res) => {
    const files = readdirSync(uploadDir);
    res.json({ files });
});

import popeText from "./popetext.json";

app.get('/pope' , (req, res, next) => {
    try { 
        const text = popeText[Math.floor(Math.random() * popeText.length)]
        throw new PopeCodeError(text)
    } catch (err) {
        next(err)
    }
})

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
        const form = new IncomingForm({allowEmptyFiles: true});
      
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



app.get('*', (req, res) => { //404
    res.status(404).send("Error 404 : Page not found")
})

class PopeCodeError extends Error {
    constructor(message: string){
        super(message);
        this.name = 'PopeErrorCode',
        Object.setPrototypeOf(this, PopeCodeError.prototype)
    }
}

app.use((err, req, res, next) => {
    if(err instanceof PopeCodeError) {
        res.status(410).send(`Error ${POPECODE} : ${err.message}`)
    }
    console.error(err)
    res.status(500).send("Error 500 : Server side error \n"+err)
})

httpServer.listen(process.env.PORT || 3000, () => {
    console.log(`Server is listening on http://localhost:${process.env.PORT || 3000}`);
});
