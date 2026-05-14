-- SQLite

DROP TABLE IF EXISTS region;
DROP TABLE IF EXISTS industrial_sector;
DROP TABLE IF EXISTS polymer;
DROP TABLE IF EXISTS disposal_method;
DROP TABLE IF EXISTS global_production_by_year;
DROP TABLE IF EXISTS global_production_by_industrial_sector;
DROP TABLE IF EXISTS global_production_by_polymer;
DROP TABLE IF EXISTS plastic_waste_by_disp_method;
DROP TABLE IF EXISTS plastic_waste_by_industrial_sector;
DROP TABLE IF EXISTS plastic_waste_by_polymer;

CREATE TABLE region (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL
);

CREATE TABLE industrial_sector (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL
);

CREATE TABLE polymer (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    abbreviation TEXT DEFAULT NULL
);

CREATE TABLE disposal_method (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL
);

CREATE TABLE global_production_by_year (
    region_id TEXT NOT NULL DEFAULT 'WRL', --always region_id = 'WRL'
    year INTEGER NOT NULL,
    annual_value INTEGER NOT NULL,
    cummulative_value INTEGER NOT NULL,
    source TEXT NOT NULL,
    PRIMARY KEY (region_id, year),
    FOREIGN KEY (region_id) REFERENCES region(id)
);

CREATE TABLE global_production_by_industrial_sector (
    region_id TEXT NOT NULL DEFAULT 'WRL', --always region_id = 'WRL'
    sector_id TEXT NOT NULL,
    year INTEGER NOT NULL DEFAULT 2019, --ONLY 2019 DATA for now
    value_percent REAL NOT NULL,
    value_tonnes REAL NOT NULL,
    source TEXT NOT NULL,
    PRIMARY KEY (sector_id, region_id),
    FOREIGN KEY (sector_id) REFERENCES industrial_sector(id),
    FOREIGN KEY (region_id) REFERENCES region(id)
);

CREATE TABLE global_production_by_polymer (
    region_id TEXT NOT NULL DEFAULT 'WRL', --always region_id = 'WRL'
    polymer_id TEXT NOT NULL,
    value_percent REAL NOT NULL,
    value_tonnes REAL NOT NULL,
    year INTEGER NOT NULL DEFAULT 2019, --ONLY 2019 DATA for now
    source TEXT NOT NULL,
    PRIMARY KEY (polymer_id, region_id),
    FOREIGN KEY (polymer_id) REFERENCES polymer(id),
    FOREIGN KEY (region_id) REFERENCES region(id)
);

CREATE TABLE plastic_waste_by_disp_method (
    region_id TEXT NOT NULL,
    method_id TEXT NOT NULL, 
    value_percent REAL NOT NULL,
    value_tonnes REAL NOT NULL,
    year INTEGER NOT NULL, --ONLY 2019 DATA for now
    source TEXT NOT NULL,
    PRIMARY KEY (method_id, region_id),
    FOREIGN KEY (method_id) REFERENCES disposal_method(id),
    FOREIGN KEY (region_id) REFERENCES region(id)
);

CREATE TABLE plastic_waste_by_industrial_sector (
    region_id TEXT NOT NULL, 
    sector_id TEXT NOT NULL,
    value_percent REAL NOT NULL,
    value_tonnes REAL NOT NULL,
    year INTEGER NOT NULL, --ONLY 2019 DATA for now
    source TEXT NOT NULL,
    PRIMARY KEY (sector_id, region_id),
    FOREIGN KEY (sector_id) REFERENCES industrial_sector(id),
    FOREIGN KEY (region_id) REFERENCES region(id)
);

CREATE TABLE plastic_waste_by_polymer (
    region_id TEXT NOT NULL, 
    polymer_id TEXT NOT NULL,
    value_percent REAL NOT NULL,
    value_tonnes REAL NOT NULL,
    year INTEGER NOT NULL, --ONLY 2019 DATA for now
    source TEXT NOT NULL,
    PRIMARY KEY (polymer_id, region_id),
    FOREIGN KEY (polymer_id) REFERENCES polymer(id),
    FOREIGN KEY (region_id) REFERENCES region(id)
);



INSERT INTO region (id, name) VALUES ('WRL', 'World');
INSERT INTO region (id, name) VALUES ('SSAFR', 'Sub-Saharan Africa');
INSERT INTO region (id, name) VALUES ('ASIA', 'Asia (excl. China and India)');
INSERT INTO region (id, name) VALUES ('EUR', 'Europe');
INSERT INTO region (id, name) VALUES ('MENA', 'Middle East and North Africa');
INSERT INTO region (id, name) VALUES ('AMCS', 'Americas (excl. USA)');
INSERT INTO region (id, name) VALUES ('OCN', 'Oceania');
INSERT INTO region (id, name) VALUES ('CHN', 'China');
INSERT INTO region (id, name) VALUES ('IND', 'India');
INSERT INTO region (id, name) VALUES ('USA', 'United States');
 
INSERT INTO industrial_sector (id, name) VALUES ('PACK', 'Packaging');
INSERT INTO industrial_sector (id, name) VALUES ('B&C', 'Building and construction');
INSERT INTO industrial_sector (id, name) VALUES ('OTH', 'Other');
INSERT INTO industrial_sector (id, name) VALUES ('TRANSP', 'Transportation');
INSERT INTO industrial_sector (id, name) VALUES ('CONS&IP', 'Consumer and institutional products');
INSERT INTO industrial_sector (id, name) VALUES ('TXTL', 'Textile sector');
INSERT INTO industrial_sector (id, name) VALUES ('ELEC', 'Electrical or electronics');
INSERT INTO industrial_sector (id, name) VALUES ('IND', 'Industrial or machinery');
INSERT INTO industrial_sector (id, name) VALUES ('RM', 'Road marking');
INSERT INTO industrial_sector (id, name) VALUES ('MC', 'Marine coatings');
INSERT INTO industrial_sector (id, name) VALUES ('PCP', 'Personal care products');
INSERT INTO industrial_sector (id, name) VALUES ('TOTAL', 'Total');

INSERT INTO polymer (id, name, abbreviation) VALUES ('PE', 'Polyethylene', 'PE');
INSERT INTO polymer (id, name, abbreviation) VALUES ('PP', 'Polypropylene', 'PP');
INSERT INTO polymer (id, name, abbreviation) VALUES ('PS', 'Polystyrene', 'PS');
INSERT INTO polymer (id, name, abbreviation) VALUES ('PVC', 'Polyvinyl Chloride', 'PVC');
INSERT INTO polymer (id, name, abbreviation) VALUES ('PET', 'Polyethylene Terephthalate', 'PET');
INSERT INTO polymer (id, name, abbreviation) VALUES ('PUR', 'Polyurethane', 'PUR');
INSERT INTO polymer (id, name, abbreviation) VALUES ('ABASAN', 'Acrylonitrile Butadiene (AB), Acrylonitrile Styrene Acrylate (ASA), StyreneAcrylonitrile (SAN)', 'AB, ASA, SAN');
INSERT INTO polymer (id, name) VALUES ('BIO', 'Bioplastics');
INSERT INTO polymer (id, name) VALUES ('ELAST', 'Elastomers');
INSERT INTO polymer (id, name) VALUES ('FIB', 'Fibres');
INSERT INTO polymer (id, name, abbreviation) VALUES ('HDPE', 'High-Density Polyethylene', 'HDPE');
INSERT INTO polymer (id, name, abbreviation) VALUES ('LLDPE', 'Linear Low-Density Polyethylene', 'LLDPE');
INSERT INTO polymer (id, name) VALUES ('MC', 'Marine coatings');
INSERT INTO polymer (id, name) VALUES ('OTH', 'Other');
INSERT INTO polymer (id, name) VALUES ('RMC', 'Road marking coatings');
INSERT INTO polymer (id, name) VALUES ('TOTAL', 'Total');

INSERT INTO disposal_method (id, name) VALUES ('REC', 'Recycled');
INSERT INTO disposal_method (id, name) VALUES ('LNDF', 'Landfilled');
INSERT INTO disposal_method (id, name) VALUES ('INC', 'Incinerated');
INSERT INTO disposal_method (id, name) VALUES ('MM', 'Mismanaged');


