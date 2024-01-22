import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { config } from 'dotenv';
import { join, extname, parse } from 'path';
import { readdirSync, readFile, existsSync, mkdirSync, writeFile, rename, createReadStream } from 'fs';
import { IncomingForm, File } from 'formidable';
import consolidate from 'consolidate';
import { promisify } from 'util';

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

const textExt = [ 'js', 'java', 'hbs', 'py', 'c', 'cpp', 'php', 'html', 'css', 'ruby', 'swift','go', 'kotlin', 'typescript', 'scala', 'rust', 'shell', 'powershell','sql', 'r', 'perl', 'dart', 'lua', 'vb', 'matlab', 'groovy', 'haskell','cobol', 'fortran', 'scheme', 'prolog', 'jsx', 'tsx', 'vue', 'svelte','scss', 'sass', 'less', 'coffee', 'asm', 'json', 'xml', 'yaml', 'toml','ini', 'bat', 'sh', 'makefile', 'dockerfile', 'md', 'txt', 'cs']

app.get('/file/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = join(uploadDir, fileName);

    readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            res.status(500).send('Błąd podczas odczytu pliku.');
        } else {
            if(textExt.includes(extname(filePath).toLowerCase())){
                readTextFile(filePath).then((fileContent) => {
                    res.status(200).send(fileContent)
                })
                .catch((err) => {
                    res.status(451).send(err)
                    console.error(err)
                })
            } else {
                res.status(200).sendFile(filePath)
            }
        }
    });
});

app.get("/download/:fileName", (req, res) => {
    const fileName = req.params.fileName;
    const filePath = join(uploadDir, fileName)
    res.download(filePath, fileName, (err) =>{
        if(err){
            console.error(err)
            res.status(500).json({message: 'Error downloading file'})
        }
    })
})

const upload = async (req:Request, res: Response) => {
    try {
        const form = new IncomingForm({allowEmptyFiles: true, minFileSize:0});
        
      
        form.parse(req, (err, field, files) => {
            if (err) throw err;
            if (!files.fileInput) return res.status(401).json({ message: 'No file Selected' });
            for (const file of files.fileInput) {
                if(file.size === 0){continue}
                const originalFilename = file.originalFilename
                const newFilepath = getUniqueFilePath(originalFilename);

                // const newFilepath = `${uploadDir}/${file.originalFilename}`;
                rename(file.filepath, newFilepath, err => err);
            }
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

// Other functions

function getUniqueFilePath(fileName:string, directory:string = uploadDir) {
    const baseFilePath = join(directory, fileName);
    if(!existsSync(baseFilePath)) return baseFilePath;
    let count = 1;
    let newFilepath;
    do{
        const afterFIx = `.${count}`;
        newFilepath = join(directory, `${parse(fileName).name}${afterFIx}${parse(fileName).ext}`);
        count++;
    }
    while(existsSync(newFilepath))
    return newFilepath;
}

function readTextFile(filePath: string):Promise<string> {
    return new Promise((resolve, reject) => {
        readFile(filePath, "utf-8", (err, data) => {
            if(err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}