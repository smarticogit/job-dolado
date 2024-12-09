<div align="center">
  <h1>DoLado Movies API</h1>
  <h2>Catálogo de filmes</h2>
  <hr>
</div>

- Projeto em NestJs
- Banco de dados: MySQL em container Docker
- TypeORM
- Documentação: Swagger
- [API OMDB](https://www.omdbapi.com/): para consultas de filmes

### Como usar?

<br>

Faça o clone do projeto e siga o passo a passo abaixo

```sh
git clone https://github.com/smarticogit/job-dolado
```

<br>

#### passo 1: instale as dependências:

```sh
npm install
```

<br>

#### passo 2: Verifique se o serviço do Docker está ativo e execute:

```sh
docker compose up --build
```

<br>

#### passo 3: Acesso a rota de documentação:

```sh
localhost:3000/docs
```

<br>

### Testes

```sh
npm run test
```

<br>
