import click
from api.models import db, User
from werkzeug.security import generate_password_hash

def setup_commands(app):
    @app.cli.command("insert-test-users")
    @click.argument("count")
    def insert_test_users(count):
        print("Creating test users")
        for x in range(1, int(count) + 1):
            user = User(
                user_name=f"test_user{x}",
                email=f"test_user{x}@test.com",
                password_hash=generate_password_hash("123456")
            )
            db.session.add(user)
        db.session.commit()
        print("All test users created")
