drop database if exists gruppe2_auth;
create database gruppe2_auth;
use gruppe2_auth;

set autocommit = 0;

create table u_user
(
    u_userId       varchar(64),
    u_firstname    varchar(64) not null,
    u_lastname     varchar(64) not null,
    u_email        varchar(64) not null unique,

    u_deletedAt    DATETIME,
    u_createdAt    DATETIME    not null,

    u_salt         varchar(64) not null, # do not expose
    u_passwordHash varchar(64) not null, # do not expose
    primary key (u_userId)
);

create view view_u_user_frontend AS
SELECT u_user.u_userId, u_user.u_firstname, u_user.u_lastname, u_user.u_email, u_user.u_deletedAt
from u_user;

create table r_roles
(
    r_id       int,
    r_rolename varchar(64) not null unique,
    primary key (r_id)
);

create table ru_rolesuser
(
    ru_r_id     int,
    ru_u_userId varchar(64),
    primary key (ru_r_id, ru_u_userId)
);

# only one session per user
create table us_usersession
(
    us_u_userId  varchar(64),
    us_sessionId varchar(64) not null unique,
    us_expiresAt DATETIME    not null,
    primary key (us_u_userId)
);

create table h_history
(
    h_u_userId varchar(64),
    h_time     DATETIME,
    h_e_event  int not null,
    primary key (h_u_userId, h_time)
);

create table e_events
(
    e_id   int         not null,
    e_name varchar(64) not null,
    primary key (e_id)
);

create table rp_registration_process
(
    rp_u_userId       varchar(64) not null,
    rp_registrationId varchar(64),
    rp_expiresAt      DATETIME    not null,

    rp_firstname      varchar(64) not null,
    rp_lastname       varchar(64) not null,
    rp_email          varchar(64) not null unique,

    primary key (rp_registrationId)
);

#rp_rolesuser
alter table ru_rolesuser
    add foreign key (ru_u_userId) references u_user (u_userId) on delete cascade on update restrict,
    add foreign key (ru_r_id) references r_roles (r_id) on delete cascade on update restrict;

#us_usersession
alter table us_usersession
    add foreign key (us_u_userId) references u_user (u_userId) on delete cascade on update restrict;

#h_history
alter table h_history
    add foreign key (h_u_userId) references u_user (u_userId) on delete cascade on update restrict,
    add foreign key (h_e_event) references e_events (e_id) on delete restrict on update restrict;

#rp_registration_process
alter table rp_registration_process
    add foreign key (rp_u_userId) references u_user (u_userId) on delete cascade on update restrict;

-- Group 3 (Sigmas) tables 
#tb_law 
create table la_law (
    la_idx         int                         auto_increment,
    la_law      varchar(64)                    not null,
    la_typ         enum('r', 'amc', 'gm', 's') not null,
    la_description varchar(64)                 not null,
    la_text        text,
    la_valid_from  date                        not null,
    la_valid_until date,
    primary key(la_idx)
);

#tb_audit
create table au_audit (
    au_idx             int                                                               auto_increment,
    au_audit_date    date                                                                not null,
    au_number_of_days      int                                                           not null,
    au_leadauditor_idx int                                                               not null,
    au_leadauditee_idx int                                                               not null,
    au_auditstatus     enum('geplant', 'bereit', 'begonnen', 'findings_offen', 'fertig') not null,
    au_place             varchar(64)                                                     not null,
    au_theme           varchar(64)                                                       not null,
    au_typ             enum('audit', 'inspektion', 'ca', 'extern', 'sonstig')            not null,
    primary key(au_idx)
);

#tb_questions
create table qu_questions (
    qu_idx           int     auto_increment,
    qu_audit_idx     int     not null,
    qu_law_idx       int     not null,
    qu_audited       boolean not null,
    qu_applicable    boolean not null,
    qu_finding_level int,
    primary key (qu_idx)
);

alter table qu_questions
add constraint fk_audit_idx1 foreign key (qu_audit_idx) references au_audit(au_idx),
add constraint fk_law_idx foreign key (qu_law_idx) references la_law(la_idx);
commit;