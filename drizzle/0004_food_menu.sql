-- Restore the supplied menu and its prices without changing existing invoices.
INSERT INTO foods (name, price) VALUES ('عريكة', 15000) ON CONFLICT(name) DO UPDATE SET price = excluded.price;
INSERT INTO foods (name, price) VALUES ('عصيدة', 13000) ON CONFLICT(name) DO UPDATE SET price = excluded.price;
INSERT INTO foods (name, price) VALUES ('مشغوثة', 15000) ON CONFLICT(name) DO UPDATE SET price = excluded.price;
INSERT INTO foods (name, price) VALUES ('مراصيع', 14000) ON CONFLICT(name) DO UPDATE SET price = excluded.price;
INSERT INTO foods (name, price) VALUES ('قرص خبز ملة كبير', 10000) ON CONFLICT(name) DO UPDATE SET price = excluded.price;
INSERT INTO foods (name, price) VALUES ('ميني ملة محشية بالجبن أو التمر', 350) ON CONFLICT(name) DO UPDATE SET price = excluded.price;
INSERT INTO foods (name, price) VALUES ('حنيني', 20000) ON CONFLICT(name) DO UPDATE SET price = excluded.price;
INSERT INTO foods (name, price) VALUES ('فتة تمر', 17000) ON CONFLICT(name) DO UPDATE SET price = excluded.price;
INSERT INTO foods (name, price) VALUES ('مرسى', 15000) ON CONFLICT(name) DO UPDATE SET price = excluded.price;
INSERT INTO foods (name, price) VALUES ('فتة حليب', 16000) ON CONFLICT(name) DO UPDATE SET price = excluded.price;
INSERT INTO foods (name, price) VALUES ('جريش أحمر', 17000) ON CONFLICT(name) DO UPDATE SET price = excluded.price;
INSERT INTO foods (name, price) VALUES ('جريش أبيض', 17000) ON CONFLICT(name) DO UPDATE SET price = excluded.price;
INSERT INTO foods (name, price) VALUES ('مرقوق باللحم', 20000) ON CONFLICT(name) DO UPDATE SET price = excluded.price;
INSERT INTO foods (name, price) VALUES ('بنت الصحن', 10000) ON CONFLICT(name) DO UPDATE SET price = excluded.price;
INSERT INTO foods (name, price) VALUES ('صحن مشكل مخبوزات', 16000) ON CONFLICT(name) DO UPDATE SET price = excluded.price;
INSERT INTO foods (name, price) VALUES ('لقيمات', 17000) ON CONFLICT(name) DO UPDATE SET price = excluded.price;
INSERT OR IGNORE INTO foods (name, price) VALUES ('سمن', 11000), ('عسل', 15000);
