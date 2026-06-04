from setuptools import setup, find_packages

setup(
    name="searchmind",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "httpx>=0.23.0",
        "pydantic>=2.0.0",
    ],
    extras_require={
        "langchain": ["langchain-core>=0.1.0"],
        "dev": ["pytest>=7.0.0"],
    },
)
