import json

# Function to generate INSERT statement for a record
def generate_insert_sql(table, record):
    quoted_keys = ['"start"', '"end"']

    if table == 'sessions':
        keys = ['id', 'type', 'room', '"start"', '"end"', 'language', 'co_write', 'uri']
        values = [record.get(key) for key in keys]
        zh_keys = ['title', 'description']
        keys += zh_keys
        values += [record['zh'].get(key) for key in zh_keys]
    elif table in ['speakers', 'session_types', 'rooms', 'tags']:
        keys = ['id']
        values = [record.get(key) for key in keys]
        zh_keys = ['name', 'description']
        keys += zh_keys
        values += [record['zh'].get(key) for key in zh_keys]

    # Format values into SQL-friendly string
    values = ["NULL" if val is None else "'{}'".format(str(val).replace("'", "''")) for val in values]

    return f"INSERT INTO {table} ({', '.join(keys)}) VALUES ({', '.join(values)});\n"

# Load the JSON file
with open('session.json', 'r') as f:
    data = json.load(f)

# Prepare the SQL output file
with open('output.sql', 'w') as f:
    # Generate SQL INSERT statements for each table
    for table_name in data.keys():
        for record in data[table_name]:
            f.write(generate_insert_sql(table_name, record))
