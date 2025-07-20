# Code Challenge - CloudHumans

Este repositório contém a solução para o desafio técnico proposto pela CloudHumans, que consiste na criação de uma API de chatbot utilizando a técnica de RAG (Retrieval Augmented Generation).

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Como Executar a Aplicação](#como-executar-a-aplicação)
  - [Pré-requisitos](#pré-requisitos)
  - [Executando com Docker](###executando-com-docker)
  - [Executando Localmente](#executando-localmente)
- [Decisões Técnicas](#decisões-técnicas)
- [Propostas de melhorias](#propostas-de-melhorias)
- [Estrutura da Resposta da API](#estrutura-da-resposta-da-api)
- [Comentários Adicionais](#comentários-adicionais)
- [Autor](#autor)

## Sobre o Projeto

O objetivo deste projeto é fornecer respostas de chatbot inteligentes e contextuais com base em uma base de dados específica de uma empresa (neste caso, a Tesla Motors). A API implementa a técnica de **Retrieval Augmented Generation (RAG)** para garantir que as respostas sejam precisas e restritas ao conhecimento fornecido.

A solução foi projetada de forma modular para permitir a fácil integração com dados de outras empresas no futuro.

### Funcionalidade Implementada

Para este desafio, optei por implementar as **duas features extras propostas**. Por achar interessante as propostas, e aproveitar para servir como estudos.

* **Esclarecimento**: A IA tentará pedir mais detalhes ao usuário até duas vezes se a pergunta for ambígua. Na terceira tentativa, a conversa será escalada para um atendente humano.
* **Encaminhamento**: Sempre que uma pergunta estiver relacionada a um conteúdo classificado como **N2**, a API indicará a necessidade de intervenção humana retornando o campo `handoverToHumanNeeded: true`.

## Tecnologias Utilizadas

Para o desenvolvimento da solução, as seguintes tecnologias e bibliotecas foram empregadas:

* **Linguagem:** Javascript / Node.js v18
* **Framework:** Express.js
* **Vector Database:** O disponibilizado para o code-challenge.
* **Containerização:** Docker
* **Principais Bibliotecas:** Axios (para fetching das APIs)
## Como Executar a Aplicação

Siga as instruções abaixo para configurar e executar o projeto em seu ambiente.

### Pré-requisitos

* [Git](https://git-scm.com)
* [Docker](https://www.docker.com/get-started/) e [Docker Compose](https://docs.docker.com/compose/install/)
* [Node.js](https://nodejs.org/en/) (para execução local)
* Configurar seu .ENV

### Executando com Docker (Recomendado)

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/Yuri-Costa09/cloud-humans-code-challenge
    cd cloud-humans-code-challenge
    ```
2. **Setar variáveis de ambiente**
  ```bash
    No projeto já há um env.example ao clonar, apenas preencha as Keys necessárias.
  ```
3.  **Construa e inicie os contêineres:**
    ```bash
    docker-compose up --build
    ```

4.  A API estará disponível no endereço: `http://localhost:3000`

### Executando Localmente

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/Yuri-Costa09/cloud-humans-code-challenge
    cd cloud-humans-code-challenge
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Inicie a aplicação:**
    ```bash
    # Para Node.js
    npm run start
    ```

## Decisões Técnicas

1.  **Estrutura da Aplicação e Separação de Responsabilidades:**
    Optei por uma arquitetura em camadas para garantir um código organizado, manutenível e escalável. O arquivo principal (`server.js`) atua como a camada de entrada (Controller), responsável por gerenciar as rotas e o endpoint `POST /conversations/completions`. Toda a lógica de negócio, incluindo as chamadas para as APIs externas e o processamento de dados, foi abstraída para uma camada de Serviços (`Services`). Essa abordagem de Separação de Responsabilidades (Separation of Concerns) mantém o código do endpoint limpo e focado, facilitando testes e futuras manutenções.

2.  **Otimização do Processo de RAG (Retrieval-Augmented Generation):**
    Para garantir respostas relevantes e eficientes, realizei as seguintes otimizações:
    * **Modelo de Geração:** Utilizei o modelo **GPT-4o** para a geração das respostas finais. A escolha foi baseada na recomendação do material de apoio do desafio (vídeo de Fabrício Risseto), por ser um modelo com excelente custo-benefício, não exigindo computação excessivamente cara e sendo ideal para este caso de uso.

    * **Recuperação de Contexto (Top-k):** Limitei a busca no banco de dados vetorial para retornar apenas os **5 documentos mais relevantes (top-k=5)** para cada pergunta. Durante o desenvolvimento, notei que documentos além do quinto resultado apresentavam uma queda acentuada na relevância, introduzindo ruído desnecessário no contexto enviado ao modelo de linguagem.

    * **Limite de Tokens:** Estabeleci um limite máximo de **450 tokens** para as respostas geradas pela API de completions da OpenAI. Testes empíricos mostraram que este tamanho é suficiente para fornecer respostas completas e detalhadas na grande maioria dos casos, ao mesmo tempo que otimiza os custos e previne abusos ou respostas excessivamente longas.

3.  **Implementação da Lógica de Negócio:** desafio propunha a implementação de uma entre duas funcionalidades: encaminhamento (handover) ou esclarecimento (clarification). Como foi dito acima, eu decidi implementar as duas. A lógica para a funcionalidade escolhida foi a seguinte:
    

    * **Encaminhamento Baseado em Metadados (Handover):** A verificação para encaminhar um atendimento a um humano é feita de forma direta e eficiente. Após a busca na base vetorial, o sistema analisa os metadados do documento de maior relevância. Se este documento estiver rotulado como `N2`, a API automaticamente inclui o campo `handoverToHumanNeeded: true` na resposta, sinalizando a necessidade de intervenção.

    * **Pedido de Esclarecimento com Gerenciamento de Sessão:** Esta funcionalidade foi implementada da seguinte forma:
        * **Gerenciamento de Sessão:** A API gerencia o estado da conversa através de um `helpdeskId`, que funciona como um identificador de sessão.
        * **Limiar de Confiança:** Com base em testes, foi definido um limiar de confiança de `0.5`. Se o documento mais relevante retornado pela busca vetorial tiver uma pontuação de similaridade inferior a `0.5`, a resposta é considerada de baixa confiança.

        * **Lógica de Escalonamento:** Para cada resposta de baixa confiança em uma mesma sessão (`helpdeskId`), um contador é incrementado. Quando este contador atinge o limite de **2 tentativas**, a API conclui que não consegue ajudar o usuário de forma autônoma. A resposta final, então, sugere o contato com um atendente e retorna o campo `needHuman: true`.

# Propostas para melhorias
### Validator Agent
Após pesquisas sobre modelos RAG, eu me deparei com uma feature extra interessante chamada **Validator Agent**, que após a resposta do **Agent Generativo** (aquele que gera a resposta), ele atua como um ***crítico*** da resposta deste agent. Que, com base em um conjunto de regras, libera a resposta ou não. Diminuindo **Drásticamente** as alucinações.


## Exemplos de requests da API

```bash
POST http://localhost:3000/conversations/completions
```

### **Exemplo de Request bem sucedida:**

```json
{
    "helpdeskId": 123456,
    "projectName": "tesla_motors",
    "messages": [
        {
            "role": "USER",
            "content": "What is Tesla?"
        }
    ]
}
```
#### **Response esperada:**
```json
{
    "messages": [
        {
            "role": "USER",
            "content": "What is Tesla?"
        },
        {
            "role": "ASSISTANT",
            "content": "Hello there!\n\nTesla is a technology and automotive company that focuses on producing electric vehicles, developing energy solutions, and advancing autonomous driving technology. They are known for their innovative approach to sustainability and reducing the environmental impact of transportation.\n\nIf you have more questions, feel free to ask! 😊"
        }
    ],
    "handoverToHumanNeeded": false,
    "sectionsRetrieved": [
        {
            "content": "What is Tesla? Tesla is a technology and automotive company focused on producing electric vehicles, energy solutions, and autonomous driving technology.",
            "searchScore": 0.68987966
        },
        {
            "content": "What is Tesla Insurance? Tesla Insurance is a vehicle insurance program offered by Tesla in some US states.",
            "searchScore": 0.561568
        },
        {
            "content": "How does Tesla contribute to the environment? Tesla reduces CO₂ emissions by producing electric vehicles and developing sustainable energy technologies.",
            "searchScore": 0.4989445
        },
        {
            "content": "What is Tesla Powerwall? Powerwall is a home battery that stores solar energy for later use.",
            "searchScore": 0.49498606
        },
        {
            "content": "What is a Supercharger? Supercharger is Tesla's network of fast-charging stations, strategically placed to facilitate long-distance travel.",
            "searchScore": 0.49430192
        }
    ]
}
```
---

### **Exemplo de Request (Handover):**
```json
{
    "helpdeskId": 123456,
    "projectName": "tesla_motors",
    "messages": [
        {
            "role": "USER",
            "content": "Can I buy a Tesla with cryptos like DogeCoins?"
        }
    ]
}
```
#### **Response esperada:**
```json
{
    "messages": [
        {
            "role": "USER",
            "content": "Can I buy a Tesla with cryptos like DogeCoins?"
        },
        {
            "role": "ASSISTANT",
            "content": "That's an important question! I'm passing this over to a specialized team member who'll get back to you as soon as possible. Feel free to relax, and we'll be right with you."
        }
    ],
    "handoverToHumanNeeded": true,
    "sectionsRetrieved": [
        {
            "content": "Can I buy a Tesla with cryptos like DogeCoins? Yes, this is possible, I'll forward you to talk with Elon. Wait a second please.",
            "searchScore": 0.70510805
        },
        {
            "content": "Can I finance a Tesla purchase? Yes, Tesla offers financing options in various countries.",
            "searchScore": 0.49829346
        },
        {
            "content": "Is it safe to buy a used Tesla? Yes, but it is recommended to buy from a dealership or a trusted seller.",
            "searchScore": 0.45643723
        },
        {
            "content": "What car models does Tesla offer? Tesla offers the Model S, Model 3, Model X, Model Y, and the Cybertruck.",
            "searchScore": 0.4451929
        },
        {
            "content": "Is Tesla compatible with any country’s power grid? Yes, with adapters, Tesla can be charged on any power grid.",
            "searchScore": 0.4427117
        }
    ]
}
```
---
### **Exemplo de Request (Clarification)
```json
{
    "helpdeskId": 123456,
    "projectName": "tesla_motors",
    "messages": [
        {
            "role": "USER",
            "content": "What is the color of the tires of a tesla model x"
        }
    ]
}
```
#### **Response esperada**
```json
{
    "messages": [
        {
            "role": "USER",
            "content": "What is the color of the tires of a tesla model x"
        },
        {
            "role": "ASSISTANT",
            "content": "Hello! How can I assist you today? I'm Claudia, your Tesla support assistant 😊 Could you please provide me with more information about your question? So i provide you with the most accurate answer."
        }
    ],
    "handoverToHumanNeeded": false,
    "sectionsRetrieved": [
        {
            "content": "How is the Tesla Model X different from other models? The Model X is an SUV with Falcon Wing doors and more interior space.",
            "searchScore": 0.48256174
        },
        {
            "content": "What accessories are available for Tesla vehicles? Custom floor mats, seat covers, chargers, and other accessories are offered.",
            "searchScore": 0.45959237
        },
        {
            "content": "What car models does Tesla offer? Tesla offers the Model S, Model 3, Model X, Model Y, and the Cybertruck.",
            "searchScore": 0.44976416
        },
        {
            "content": "What is Tesla's battery warranty? Tesla’s battery warranty typically lasts for 8 years or about 150,000 miles, depending on the model.",
            "searchScore": 0.44097075
        },
        {
            "content": "What is the average range of a Tesla? The range varies between 250 and 370 miles, depending on the model and driving conditions.",
            "searchScore": 0.4386771
        }
    ]
}
```
#### **Após acabar as tentativas:**
```json
{
    "messages": [
        {
            "role": "USER",
            "content": "What is the color of the tires of a tesla model x"
        },
        {
            "role": "ASSISTANT",
            "content": "I'll redirect you to a human agent. We'll be right with you."
        }
    ],
    "handoverToHumanNeeded": true,
    "sectionsRetrieved": [
        {
            "content": "How is the Tesla Model X different from other models? The Model X is an SUV with Falcon Wing doors and more interior space.",
            "searchScore": 0.48258466
        },
        {
            "content": "What accessories are available for Tesla vehicles? Custom floor mats, seat covers, chargers, and other accessories are offered.",
            "searchScore": 0.4595727
        },
        {
            "content": "What car models does Tesla offer? Tesla offers the Model S, Model 3, Model X, Model Y, and the Cybertruck.",
            "searchScore": 0.44976676
        },
        {
            "content": "What is Tesla's battery warranty? Tesla’s battery warranty typically lasts for 8 years or about 150,000 miles, depending on the model.",
            "searchScore": 0.4409818
        },
        {
            "content": "What is the average range of a Tesla? The range varies between 250 and 370 miles, depending on the model and driving conditions.",
            "searchScore": 0.4386882
        }
    ]
}
```
