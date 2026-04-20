# Ruby on Windows may fail to glob Rails migration files when db:load_config
# expands the migration path to an absolute "C:/..." path. Keep it relative so
# standard Rails tasks can find and run migrations normally.
if Gem.win_platform?
  Rake::Task["db:load_config"].enhance do
    ActiveRecord::Migrator.migrations_paths = ["db/migrate"]
    ActiveRecord::Tasks::DatabaseTasks.migrations_paths = ["db/migrate"]
  end
end