using {my.app as Application} from '../db/schema';
service CatalogService {
  entity Customers as projection on Application.Customer;
}