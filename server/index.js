const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

let do1 = 0;
let motors = false;
let mode = "manual";

app.use(cors());
app.use(express.json());

app.get('/api/ping', (req, res) => {
  res.json({ message: 'Servidor funcionando' });
});

app.get('/', (req, res) => {
  res.send('Servidor activo');
});

app.get('/api/io/di1', (req, res) => {
  res.json({
    signal: 'Local_IO_0_DI1',
    value: do1,
    message: 'DI1 leído correctamente',
  });
});

app.post('/api/io/do1/on', (req, res) => {
  do1 = 1;
  res.json({
    signal: 'Local_IO_0_DO1',
    value: do1,
    message: 'DO1 encendido',
  });
});

app.post('/api/io/do1/off', (req, res) => {
  do1 = 0;
  res.json({
    signal: 'Local_IO_0_DO1',
    value: do1,
    message: 'DO1 apagado',
  });
});

app.post('/api/motors/on', (req,res)=>{

    motors=true;

    res.json({
        motors: motors,
        message:"Motores activados"
    });

});

app.post('/api/motors/off', (req,res)=>{

    motors=false;

    res.json({
        motors: motors,
        message:"Motores desactivados"
    });

});


app.post('/api/mode/manual',(req,res)=>{

    mode="manual";

    res.json({
        mode:mode,
        message:"Modo manual activado"
    });

});


app.post('/api/mode/auto',(req,res)=>{

    mode="auto";

    res.json({
        mode:mode,
        message:"Modo automático activado"
    });

});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
