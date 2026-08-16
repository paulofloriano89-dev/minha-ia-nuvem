const express = require('express');
const Groq = require('groq-sdk');

const app = express();
app.use(express.json({ limit: '10mb' }));

// Inicializa o Llama via Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

    try {
        const { mensagem } = req.body;
        
        // Chamada ultra-rápida para o Llama 3.1 da Meta
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: mensagem || "Olá",
                },
            ],
            model: "llama-3.1-8b-instant", // Modelo super rápido e leve
        });

        const respostaTexto = chatCompletion.choices[0]?.message?.content || "Sem resposta";
        res.json({ resposta: respostaTexto });
    } catch (error) {
        console.error("Erro no Llama:", error);
        res.status(500).json({ erro: `Erro ao processar: ${error.message}` });
    }
});

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
