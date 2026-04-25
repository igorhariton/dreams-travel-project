using Microsoft.AspNetCore.Mvc;
using TravelBackend.BusinessLayer.Interfaces;
using TravelBackend.Domain.Models.Favorite;

namespace TravelBackend.Api.Controller
{
    [Route("api/favorite")]
    [ApiController]
    public class FavoriteController : ControllerBase
    {
        private IFavoriteAction _favorite;

        public FavoriteController()
        {
            var bl = new BusinessLayer.BusinessLogic();
            _favorite = bl.FavoriteAction();
        }

        [HttpGet("getAll")]
        public IActionResult GetAll()
        {
            var favorites = _favorite.GetAllFavoritesAction();
            return Ok(favorites);
        }

        [HttpGet]
        public IActionResult Get(int id)
        {
            var favorite = _favorite.GetFavoriteByIdAction(id);
            return Ok(favorite);
        }

        [HttpPost]
        public IActionResult Create([FromBody] FavoriteDto data)
        {
            var responce = _favorite.CreateFavoriteAction(data);
            return Ok(responce);
        }

        [HttpDelete]
        public IActionResult Delete(int id)
        {
            var responce = _favorite.DeleteFavoriteAction(id);
            return Ok(responce);
        }
    }
}
