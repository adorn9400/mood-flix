import { Client, Databases, ID, Query } from "appwrite";

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject(PROJECT_ID);

const database = new Databases(client);

export const updateSearchCount = async (searchTerm, movie) => {
    try {
        // query by the attribute name "searchTerm"
        const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.equal("searchTerm", searchTerm),
        ]);

        if (result.documents.length > 0) {
            const doc = result.documents[0];
            // defensive: ensure count is a number
            const newCount = (typeof doc.count === "number") ? doc.count + 1 : 1;
            await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
                count: newCount,
            });
        } else {
            await database.createDocument(
                DATABASE_ID,
                COLLECTION_ID,
                ID.unique(),
                {
                    searchTerm,
                    count: 1,
                    movie_id: movie?.id ?? null,
                    poster_url: movie?.poster_path
                        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                        : null,
                }
            );
        }
    } catch (error) {
        console.error("updateSearchCount error:", error);
    }
};

export const getTrendingMovies = async () => {
    try {
        const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.limit(5),
            Query.orderDesc("count")
        ]);
        return result.documents;
    } catch (error) {
        console.error("Error getting trending movies:", error);
    }
}