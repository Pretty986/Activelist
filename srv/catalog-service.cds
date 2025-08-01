using { my.db as db } from '../db/schema';
 
service CatalogService {
    entity Entity1 as projection on db.Entity1;
    entity Entity2 as projection on db.Entity2;
}