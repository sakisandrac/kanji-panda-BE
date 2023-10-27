/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
    .createTable('user_user', function (table) {
      table.string('user_id').primary();
      table.string('name');
      table.string('auth_id');
      table.string('email');
      table.timestamps(true, true);
    })

    .createTable('kanji', function (table) {
        table.string('k_id').primary();
        table.string('k_utf');
        table.string('meaning');
        table.string('kunyomi');
        table.string('onyomi');
        table.timestamps(true, true);
    })

    .createTable('kanji_to_user', function (table) {
        table.string('id').primary();
        table.string('user_id');
        table.foreign('user_id')
            .references('user_user.user_id')
        table.string('k_id');
        table.foreign('k_id')
            .references('kanji.k_id')
        table.boolean('studied');
        table.timestamps(true, true);
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
    .dropTable('kanji_to_user')
    .dropTable('kanji')
    .dropTable('user_user')
};
