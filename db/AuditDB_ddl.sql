drop database if exists audit;
create database audit;
use audit;

create table audit.au_audit
(
    au_idx             int auto_increment
        primary key,
    au_audit_date      date                                                               not null,
    au_number_of_days  int                                                                not null,
    au_leadauditor_idx varchar(64)                                                        not null,
    au_leadauditee_idx varchar(64)                                                        not null,
    au_auditstatus     enum ('geplant', 'bereit', 'begonnen', 'findings_offen', 'fertig') not null,
    au_place           varchar(64)                                                        not null,
    au_theme           varchar(64)                                                        not null,
    au_typ             enum ('audit', 'inspektion', 'ca', 'extern', 'sonstig')            not null
);

create table audit.e_events
(
    e_id   int         not null
        primary key,
    e_name varchar(64) not null
);

create table audit.fa_findingattachments
(
    fa_id       int auto_increment
        primary key,
    fa_file     longblob     not null,
    fa_fid      int          not null,
    fa_filename varchar(255) not null
);

create table audit.la_law
(
    la_idx         int auto_increment
        primary key,
    la_law         varchar(64)                  not null,
    la_typ         enum ('r', 'amc', 'gm', 's') not null,
    la_description varchar(64)                  not null,
    la_text        text                         null,
    la_valid_from  date                         not null,
    la_valid_until date                         null
);

create table audit.qu_questions
(
    qu_idx           int auto_increment
        primary key,
    qu_audit_idx     int        not null,
    qu_law_idx       int        not null,
    qu_audited       tinyint(1) not null,
    qu_applicable    tinyint(1) not null,
    qu_finding_level int        null,
    constraint fk_audit_idx1
        foreign key (qu_audit_idx) references audit.au_audit (au_idx),
    constraint fk_law_idx
        foreign key (qu_law_idx) references audit.la_law (la_idx)
);

create table audit.r_roles
(
    r_id       int         not null
        primary key,
    r_rolename varchar(64) not null,
    constraint r_rolename
        unique (r_rolename)
);

create table audit.u_user
(
    u_userId            varchar(64) not null
        primary key,
    u_firstname         varchar(64) not null,
    u_lastname          varchar(64) not null,
    u_email             varchar(64) not null,
    u_deletedAt         datetime    null,
    u_createdAt         datetime    not null,
    u_salt              varchar(64) not null,
    u_passwordHash      varchar(64) not null,
    u_erstellberechtigt tinyint(1)  null,
    constraint u_email
        unique (u_email)
);

create table audit.f_findings
(
    f_id              int auto_increment
        primary key,
    f_level           int                                                   null,
    f_creation_date   datetime                                              null,
    f_timeInDays      int                                                   null,
    f_au_audit_idx    int                                                   not null,
    f_qu_question_idx int                                                   not null,
    f_u_auditor_id    varchar(64)                                           null,
    f_status          enum ('offen', 'richtig', 'dokumentiert', 'kritisch') not null,
    f_comment         text                                                  null,
    f_finding_comment text                                                  null,
    constraint f_au_audit_idx
        foreign key (f_au_audit_idx) references audit.au_audit (au_idx),
    constraint f_findings_ibfk_1
        foreign key (f_qu_question_idx) references audit.qu_questions (qu_idx),
    constraint f_qu_question_idx
        foreign key (f_qu_question_idx) references audit.qu_questions (qu_idx),
    constraint f_u_auditor_id
        foreign key (f_u_auditor_id) references audit.u_user (u_userId)
);

create table audit.fw_finding_workon
(
    fw_idx         int auto_increment
        primary key,
    fw_finding_idx int          null,
    fw_kommentar   varchar(255) null,
    constraint fw_finding_idx
        foreign key (fw_finding_idx) references audit.f_findings (f_id)
);

create table audit.h_history
(
    h_u_userId varchar(64) not null,
    h_time     datetime    not null,
    h_e_event  int         not null,
    primary key (h_u_userId, h_time),
    constraint h_history_ibfk_1
        foreign key (h_u_userId) references audit.u_user (u_userId)
            on delete cascade,
    constraint h_history_ibfk_2
        foreign key (h_e_event) references audit.e_events (e_id)
);

create index h_e_event
    on audit.h_history (h_e_event);

create table audit.rp_registration_process
(
    rp_u_userId       varchar(64) not null,
    rp_registrationId varchar(64) not null
        primary key,
    rp_expiresAt      datetime    not null,
    rp_firstname      varchar(64) not null,
    rp_lastname       varchar(64) not null,
    rp_email          varchar(64) not null,
    constraint rp_email
        unique (rp_email),
    constraint rp_registration_process_ibfk_1
        foreign key (rp_u_userId) references audit.u_user (u_userId)
            on delete cascade
);

create index rp_u_userId
    on audit.rp_registration_process (rp_u_userId);

create table audit.ru_rolesuser
(
    ru_r_id     int         not null,
    ru_u_userId varchar(64) not null,
    audit       int         not null,
    primary key (ru_u_userId, audit),
    constraint ru_rolesuser_ibfk_1
        foreign key (ru_u_userId) references audit.u_user (u_userId)
            on delete cascade,
    constraint ru_rolesuser_ibfk_2
        foreign key (ru_r_id) references audit.r_roles (r_id)
            on delete cascade
);

create table audit.us_usersession
(
    us_u_userId  varchar(64) not null
        primary key,
    us_sessionId varchar(64) not null,
    us_expiresAt datetime    not null,
    constraint us_sessionId
        unique (us_sessionId),
    constraint us_usersession_ibfk_1
        foreign key (us_u_userId) references audit.u_user (u_userId)
            on delete cascade
);

