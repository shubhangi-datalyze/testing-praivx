import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// [title, author, genre, year, pages]
const BOOKS: [string, string, string, number, number][] = [
  ["Pride and Prejudice", "Jane Austen", "Romance", 1813, 432],
  ["Emma", "Jane Austen", "Romance", 1815, 474],
  ["Jane Eyre", "Charlotte Bronte", "Romance", 1847, 532],
  ["Outlander", "Diana Gabaldon", "Romance", 1991, 850],
  ["Normal People", "Sally Rooney", "Romance", 2018, 288],
  ["The Hobbit", "J.R.R. Tolkien", "Fantasy", 1937, 310],
  ["The Fellowship of the Ring", "J.R.R. Tolkien", "Fantasy", 1954, 423],
  ["A Game of Thrones", "George R.R. Martin", "Fantasy", 1996, 694],
  ["The Name of the Wind", "Patrick Rothfuss", "Fantasy", 2007, 662],
  ["Mistborn", "Brandon Sanderson", "Fantasy", 2006, 541],
  ["The Way of Kings", "Brandon Sanderson", "Fantasy", 2010, 1007],
  ["Circe", "Madeline Miller", "Fantasy", 2018, 393],
  ["Dune", "Frank Herbert", "Science Fiction", 1965, 412],
  ["Foundation", "Isaac Asimov", "Science Fiction", 1951, 255],
  ["Neuromancer", "William Gibson", "Science Fiction", 1984, 271],
  ["The Left Hand of Darkness", "Ursula K. Le Guin", "Science Fiction", 1969, 304],
  ["The Dispossessed", "Ursula K. Le Guin", "Science Fiction", 1974, 387],
  ["Project Hail Mary", "Andy Weir", "Science Fiction", 2021, 476],
  ["The Martian", "Andy Weir", "Science Fiction", 2011, 369],
  ["The Three-Body Problem", "Liu Cixin", "Science Fiction", 2008, 400],
  ["The Hound of the Baskervilles", "Arthur Conan Doyle", "Mystery", 1902, 256],
  ["Murder on the Orient Express", "Agatha Christie", "Mystery", 1934, 256],
  ["And Then There Were None", "Agatha Christie", "Mystery", 1939, 272],
  ["Gone Girl", "Gillian Flynn", "Mystery", 2012, 432],
  ["The Girl with the Dragon Tattoo", "Stieg Larsson", "Mystery", 2005, 465],
  ["The Thursday Murder Club", "Richard Osman", "Mystery", 2020, 382],
  ["1984", "George Orwell", "Fiction", 1949, 328],
  ["Animal Farm", "George Orwell", "Fiction", 1945, 112],
  ["To Kill a Mockingbird", "Harper Lee", "Fiction", 1960, 281],
  ["The Great Gatsby", "F. Scott Fitzgerald", "Fiction", 1925, 180],
  ["Beloved", "Toni Morrison", "Fiction", 1987, 324],
  ["The Remains of the Day", "Kazuo Ishiguro", "Fiction", 1989, 258],
  ["Never Let Me Go", "Kazuo Ishiguro", "Fiction", 2005, 288],
  ["Sapiens", "Yuval Noah Harari", "History", 2011, 443],
  ["Guns, Germs, and Steel", "Jared Diamond", "History", 1997, 480],
  ["The Guns of August", "Barbara W. Tuchman", "History", 1962, 511],
  ["SPQR", "Mary Beard", "History", 2015, 608],
  ["Steve Jobs", "Walter Isaacson", "Biography", 2011, 656],
  ["Einstein: His Life and Universe", "Walter Isaacson", "Biography", 2007, 704],
  ["Becoming", "Michelle Obama", "Biography", 2018, 448],
  ["Educated", "Tara Westover", "Biography", 2018, 334],
  ["A Brief History of Time", "Stephen Hawking", "Science", 1988, 212],
  ["The Selfish Gene", "Richard Dawkins", "Science", 1976, 360],
  ["Cosmos", "Carl Sagan", "Science", 1980, 396],
  ["The Gene", "Siddhartha Mukherjee", "Science", 2016, 592],
  ["Atomic Habits", "James Clear", "Self-help", 2018, 320],
  ["Thinking, Fast and Slow", "Daniel Kahneman", "Self-help", 2011, 499],
  ["Deep Work", "Cal Newport", "Self-help", 2016, 296],
  ["The Lean Startup", "Eric Ries", "Business", 2011, 336],
  ["Zero to One", "Peter Thiel", "Business", 2014, 224],
  ["Good to Great", "Jim Collins", "Business", 2001, 320],
  ["Shoe Dog", "Phil Knight", "Business", 2016, 400],
];

async function main() {
  const existing = await db.book.count();
  if (existing > 0) {
    console.log(`Seed skipped: ${existing} books already present.`);
    return;
  }
  for (const [title, author, genre, year, pages] of BOOKS) {
    await db.book.create({
      data: {
        title,
        author,
        genre,
        year,
        pages,
        description: `${title} by ${author} (${year}).`,
      },
    });
  }
  console.log(`Seeded ${BOOKS.length} books.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
