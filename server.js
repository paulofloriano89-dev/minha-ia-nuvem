const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json({ limit: '10mb' }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let usuarioLogado = false;

app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    if (email === process.env.ADMIN_EMAIL && senha === process.env.ADMIN_PASSWORD) {
        usuarioLogado = true;
        res.json({ sucesso: true });
    } else {
        res.status(401).json({ sucesso: false, erro: 'Credenciais inválidas' });
    }
});

app.post('/api/chat', async (req, res) => {
    if (!usuarioLogado) {
        return res.status(401).json({ erro: 'Não autorizado' });
    }

    const { mensagem, imagem, mimeType } = req.body;

    // Apenas os modelos rápidos e válidos
    const modelos = ['gemini-1.5-flash', 'gemini-1.5-pro'];

    for (const nomeModelo of modelos) {
        try {
            const model = genAI.getGenerativeModel({ model: nomeModelo });
            let promptParts = [mensagem || "Analise este arquivo:"];

            if (imagem) {
                promptParts.push({
                    inlineData: {
                        data: imagem,
                        mimeType: mimeType || 'image/jpeg'
                    }
                });
            }

            const result = await model.generateContent(promptParts);
            const response = await result.response;
            return res.json({ resposta: response.text() });
        } catch (error) {
            console.error(`Falha no ${nomeModelo}:`, error.message);
        }
    }

    res.status(500).json({ erro: 'Servidor do Google ocupado. Tente novamente em instantes.' });
});

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
