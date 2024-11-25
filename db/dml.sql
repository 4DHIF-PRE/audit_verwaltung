use gruppe2_auth;

set autocommit = 0;

insert into r_roles (r_id, r_rolename)
values (1, 'Admin'),
       (2, 'Auditor'),
       (3, 'Auditee'),
       (4, 'Gast'),
       (5, 'Reporter'),
       (6, 'Manual-Writer');

insert into e_events(e_id, e_name)
values (1, 'Password changed'),
       (2, 'Deleted user');

# the password '1234' is used by all users
insert into u_user (u_userId, u_firstname, u_lastname, u_email, u_deletedAt, u_createdAt, u_salt, u_passwordHash)
values ('3c1e680a775f7e51a250b387216848624bfd625503d0c0c25ff5f760a0ebf195', 'Max', 'Maier', 'max.maier@gmail.com', null,
        '2023-09-10', '3df349379b4b5da920e95722baaf275be00b1e6309f8d6ce742e35b9003bbc22',
        'b51b9b2b00c61fb191ef7927ad36a7277c8c76c607de65530ffcabbbf0cb6377'),

       ('dc75a6d8719fdfea62401c19fa8502eb746f4ae869c0cfb77316a118d1c731bc', 'Hans', 'Müller', 'hans.müller@gmail.com',
        null, '2023-09-11', '045328de316b71632e45c5efd7800c89ec7ddd19cae869564919cc3446a21bfc',
        '0c966d6e3963df17760831399feb16159e3fd92c9112fe03a30bfbb5817e46bb'),

       ('bd311bca2ee252585a3c0ddc8613dea2a57b1830d3591ef099f142cbae9655ee', 'Jutta', 'Huber', 'jutta.huber@gmail.com',
        null, '2023-09-12', 'e89b339b9835022ec4b6fb331f47e6bc5eac000b6aabd0e3474182561ae7415c',
        '5688bd19eee8b57def3d5bf3f481832f71ba98624e193d97b7428b0312746b39'),

       ('36fa6d5ac0acd3d6c1304f8ab31e3a26e3b15a38a6bfdaaa710681688f983803', 'Karl', 'Vogel', 'karl.vogel@gmail.com',
        null, '2023-09-13', 'd510822be75970a6dbc31b19a7823f6956cc87d354c11f50e1bfebf0eb562c87',
        '7d490e07272ab5d6beab18a34a95aafe25a15d91f39ecc850792eff780a9ff80'),

       ('f97df548cee7d2fe42ef5a1b2e001bbc47d15d2e320c00404cabd4f8f257a5cd', 'Mario', 'Hinteregger',
        'mario.hinteregger@gmail.com', null, '2023-09-14',
        'db0a9e180ccd363bb31d8670ed0a8a8eb6f0d7a7f93853b9e45f4a1d7ac66b1a',
        'a5a998a35268e65e3bfcca5ab1d0d763e4de4f869c59d89de6180ec5ffedefed'),

       ('41f188bdee58c923d78223a5e80ee48d7729be33726e97924b36c85d607831f5', 'Elisabeth', 'Kaiser',
        'elisabeth.kaiser@gmail.com', null, '2023-09-14',
        '6aca3829a3e3670f1c5f0f406e1bf7e030b4928d556dddeab893a2d4294d39dc',
        '2f30322df5997f4cf1378fa887408dc45e0f8716f42ed938dbcbcaaa1e48cc63'),

       ('ed24c33da9f02baff59fc720ff8d277175a1a137752651c1f1e39837244677a2', 'Franz', 'König', 'franz.könig@gmail.com',
        null, '2023-09-15', '705cebafbb549388ef43bbb0ca0c3cf7b8bccc5e20e669d0e1932941a562e25a',
        '1148423931b6c0c78373356efc404c586ef581bfb748857c0aa47934a540ade1'),

       ('757b088616ecc80134e2eadf08f3583328df242e20722dc852eb130520ff39fd', 'Karl', 'Platzek', 'karl.platzek@gmail.com',
        null, '2023-09-16', 'cf649d64fd481290043e276ff481c477a72f9c012a3155bf6be6073d063f9eba',
        '4654db80802c4285668ec4a236a3e0f1d00b459c400a7624fce9b9fc01fdc5b2'),

       ('0f14547a858dbddbdc7592752f699dca542efab23e86897e1a75c795fa81a023', 'Hans', 'Kern', 'hans.kern@gmail.com', null,
        '2023-09-17', 'e2a2ce82ce6c749febced146b3eec613b30a287cba4ed794168af066c4cc9d14',
        'd267f025d6ad7c6f7bb933b038f402c9d682231ea16a006f20c931954e2a8fbe'),

       ('d1d46cdd53f84591abf290480014ac76b1756ec1ca7c40f2d1b19c7fa3b95feb', 'Hubert', 'Mozart',
        'hubert.mozart@gmail.com', null, '2023-09-18',
        '55aeb2a7ceed4dca6bfa9a898bd5a4238e58b157ec860f648fe69b8764d604c8',
        'd5c3fb72b39fdc02d33c0dd778fa9fec3eb6d25b818dcf9e3a54e07cdfe33493');


insert into ru_rolesuser (ru_u_userId, ru_r_id)
values ('3c1e680a775f7e51a250b387216848624bfd625503d0c0c25ff5f760a0ebf195', 3),
       ('dc75a6d8719fdfea62401c19fa8502eb746f4ae869c0cfb77316a118d1c731bc', 3),
       ('bd311bca2ee252585a3c0ddc8613dea2a57b1830d3591ef099f142cbae9655ee', 3),
       ('36fa6d5ac0acd3d6c1304f8ab31e3a26e3b15a38a6bfdaaa710681688f983803', 3),
       ('f97df548cee7d2fe42ef5a1b2e001bbc47d15d2e320c00404cabd4f8f257a5cd', 3),
       ('41f188bdee58c923d78223a5e80ee48d7729be33726e97924b36c85d607831f5', 3),
       ('ed24c33da9f02baff59fc720ff8d277175a1a137752651c1f1e39837244677a2', 3),
       ('757b088616ecc80134e2eadf08f3583328df242e20722dc852eb130520ff39fd', 3),
       ('0f14547a858dbddbdc7592752f699dca542efab23e86897e1a75c795fa81a023', 3),
       ('d1d46cdd53f84591abf290480014ac76b1756ec1ca7c40f2d1b19c7fa3b95feb', 3),
       ('3c1e680a775f7e51a250b387216848624bfd625503d0c0c25ff5f760a0ebf195', 1),
       ('36fa6d5ac0acd3d6c1304f8ab31e3a26e3b15a38a6bfdaaa710681688f983803', 5),
       ('f97df548cee7d2fe42ef5a1b2e001bbc47d15d2e320c00404cabd4f8f257a5cd', 2),
       ('41f188bdee58c923d78223a5e80ee48d7729be33726e97924b36c85d607831f5', 2),
       ('3c1e680a775f7e51a250b387216848624bfd625503d0c0c25ff5f760a0ebf195', 2),
       ('dc75a6d8719fdfea62401c19fa8502eb746f4ae869c0cfb77316a118d1c731bc', 6);
commit;
