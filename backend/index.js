import Express from 'express';

const App = Express();
const Port = 3000;

App.listen(Port, () => {
    console.log(`Server is running on port ${Port}`);
});
