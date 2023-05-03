-- DROP TABLE IF EXISTS display;
-- CREATE TABLE display (
--     id TEXT,
--     image TEXT, 
--     text TEXT, 
--     updatedAt DATE,
--     PRIMARY KEY (`id`)
-- );

-- DROP TABLE IF EXISTS location;
-- CREATE TABLE location (
--     id TEXT,
--     title TEXT, 
--     location TEXT, 
--     mounting ENUM('roadsideMounted', 'gantryMounted'),
--     type ENUM('colourGraphic', 'monochromeGraphic'),
--     carriageway ENUM('allCarriageways', 'leftCarriageway', 'rightCarriageway'),
--     PRIMARY KEY (`id`)
-- );


DROP TABLE IF EXISTS location;
CREATE TABLE location (
    id TEXT,
    title TEXT,
    location TEXT,
    mounting TEXT,
    type TEXT,
    carriageway TEXT,
    PRIMARY KEY (`id`)
);
