using Microsoft.AspNetCore.Mvc;
using TravelBackend.BusinessLayer.Interfaces;
using TravelBackend.Domain.Models.Rental;

namespace TravelBackend.Api.Controller
{
    [Route("api/rental")]
    [ApiController]
    public class RentalController : ControllerBase
    {
        private IRentalAction _rental;

        public RentalController()
        {
            var bl = new BusinessLayer.BusinessLogic();
            _rental = bl.RentalAction();
        }

        [HttpGet("getAll")]
        public IActionResult GetAll()
        {
            var rentals = _rental.GetAllRentalsAction();
            return Ok(rentals);
        }

        [HttpGet]
        public IActionResult Get(int id)
        {
            var rental = _rental.GetRentalByIdAction(id);
            return Ok(rental);
        }

        [HttpPost]
        public IActionResult Create([FromBody] RentalDto data)
        {
            var responce = _rental.CreateRentalAction(data);
            return Ok(responce);
        }

        [HttpPut]
        public IActionResult Update([FromBody] RentalDto data)
        {
            var responce = _rental.UpdateRentalAction(data);
            return Ok(responce);
        }

        [HttpDelete]
        public IActionResult Delete(int id)
        {
            var responce = _rental.DeleteRentalAction(id);
            return Ok(responce);
        }
    }
}
