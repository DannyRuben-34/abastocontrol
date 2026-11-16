require('dotenv').config();
const { crearApp } = require('./app');
const { crearServicios } = require('./container');

const puerto = Number(process.env.PORT || 3000);
const app = crearApp({ servicios: crearServicios() });
app.listen(puerto, () => console.log(`AbastoControl API escuchando en el puerto ${puerto}`));
