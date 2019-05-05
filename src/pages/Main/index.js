import React, { Component } from "react";
import logo from "../../assets/logo.png";
import { Container, Form } from "./styles";
import CompareList from "../../components/CompareList";
import api from "../../services/api";
import moment from "moment";
export default class Main extends Component {
  state = {
    repositoryInput: "",
    repositories: [],
    repositoryError: false,
    loading: false
  };

  async componentDidMount() {
    this.setState({ loading: true });

    this.setState({
      loading: false,
      repositories: await this.getLocalRepositories()
    });
  }

  getLocalRepositories = async () =>
    JSON.parse(await localStorage.getItem("@GitCompare:repositories")) || [];

  handleAddRepository = async e => {
    e.preventDefault();
    this.setState({ loading: true });
    try {
      const { data: repository } = await api.get(
        `/repos/${this.state.repositoryInput}`
      );

      repository.lastCommit = moment(repository.pushed_at).fromNow();

      this.setState({
        repositoryInput: "",
        repositoryError: false,
        repositories: [...this.state.repositories, repository]
      });

      const localRepositories = await this.getLocalRepositories();
      //SALVA NO STORAGE
      await localStorage.setItem(
        "@GitCompare:repositories",
        JSON.stringify([...localRepositories, repository])
      );
    } catch (err) {
      this.setState({ repositoryError: true });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleRemoveRepository = async id => {
    const { repositories } = this.state;

    const withoutDeleted = repositories.filter(
      repository => repository.id !== id
    );

    this.setState({ repositories: withoutDeleted });

    await localStorage.setItem(
      "@GitCompare:repositories",
      JSON.stringify(withoutDeleted)
    );
  };

  handleUpdateRepository = async id => {
    const { repositories } = this.state;

    const repository = repositories.find(repo => repo.id === id);

    try {
      const { data } = await api.get(`/repos/${repository.full_name}`);

      data.lastCommit = moment(data.pushed_at).fromNow();

      this.setState({
        repositoryError: false,
        repositoryInput: "",
        repositories: repositories.map(repo =>
          repo.id === data.id ? data : repo
        )
      });

      await localStorage.setItem(
        "@GitCompare:repositories",
        JSON.stringify(repositories)
      );
    } catch (err) {
      this.setState({ repositoryError: true });
    }
  };

  render() {
    console.log(this.state.repositories);
    return (
      <Container>
        <img src={logo} alt="Git Compare" />
        <Form
          withError={this.state.repositoryError}
          onSubmit={this.handleAddRepository}
        >
          <input
            type="text"
            placeholder="usuário/repositório"
            value={this.state.repositoryInput}
            onChange={e => this.setState({ repositoryInput: e.target.value })}
          />
          <button type="submit">
            {this.state.loading ? (
              <i className="fa fa-spinner fa-pulse" />
            ) : (
              "OK"
            )}
          </button>
        </Form>
        <CompareList
          repositories={this.state.repositories}
          updateRepository={this.handleUpdateRepository}
          removeRepository={this.handleRemoveRepository}
        />
      </Container>
    );
  }
}
