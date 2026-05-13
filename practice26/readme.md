Тест 1: Получение всех книг с авторами

query {
  books {
    id
    title
    year
    author {
      id
      name
      birthYear
    }
  }
}

Тест 2: Получение конкретной книги по ID

query {
  book(id: "3") {
    title
    year
    author {
      name
    }
  }
}

Тест 3: Получение всех авторов с их книгами

query {
  authors {
    id
    name
    birthYear
    books {
      title
      year
    }
  }
}

Тест 4: Создание нового автора (Mutation)

mutation {
  createAuthor(name: "Михаил Булгаков", birthYear: 1891) {
    id
    name
    birthYear
  }
}

Тест 5: Создание новой книги (Mutation)

mutation {
  createBook(title: "Мастер и Маргарита", year: 1967, authorId: "4") {
    id
    title
    year
    author {
      name
    }
  }
}