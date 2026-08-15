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

    // Lista de modelos que o servidor vai testar automaticamente
    const modelosParaTestar = [
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-flash-latest'
    ];

    let respostaTexto = null;
    let ultimoErro = null;

    // Percorre a lista e tenta cada modelo até um responder
    for (const nomeModelo of modelosParaTestar) {
        try {
            console.log(`Tentando responder com o modelo: ${nomeModelo}...`);
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
            respostaTexto = response.text();

            console.log(`Sucesso com o modelo: ${nomeModelo}!`);
            break; // Encontrou um modelo funcionando, sai do loop imediatamente
        } catch (error) {
            console.error(`O modelo ${nomeModelo} falhou: ${error.message}. Tentando o próximo...`);
            ultimoErro = error;
        }
    }

    if (respostaTexto) {
        res.json({ resposta: respostaTexto });
    } else {
        res.status(500).json({ 
            erro: `Todos os modelos falharam no momento. Último erro: ${ultimoErro ? ultimoErro.message : 'Desconhecido'}` 
        });
    }
});

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
